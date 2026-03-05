import { Repository, SelectQueryBuilder } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'
import { Vehicle } from '@entity/Vehicle'
import { Person } from '@entity/Person'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import {
  BadRequestError,
  DbConflictError,
  NotFoundError,
} from '@api/errors/http.error'
import { paginate } from '@src/helpers/query-utils'

type VehiclePayload = {
  VEHICLE_ID?: number
  CUSTOMER_ID?: number
  PLATE?: string | null
  VIN?: string | null
  BRAND?: string
  MODEL?: string
  YEAR?: number | null
  COLOR?: string | null
  ENGINE?: string | null
  NOTES?: string | null
  STATE?: string
}

export type VehicleResponse = {
  VEHICLE_ID: number
  CUSTOMER_ID: number
  CUSTOMER_NAME: string
  PLATE: string
  VIN: string
  BRAND: string
  MODEL: string
  YEAR: number | null
  COLOR: string
  ENGINE: string
  NOTES: string
  STATE: string
  CREATED_AT?: Date | null
}

export class VehicleService extends BaseService {
  private vehicleRepository: Repository<Vehicle>

  constructor() {
    super()
    this.vehicleRepository = this.datasource.getRepository(Vehicle)
  }

  @CatchServiceError()
  async create(
    payload: VehiclePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<VehicleResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const customerId = Number(payload.CUSTOMER_ID)

    if (!customerId) {
      throw new BadRequestError('El campo CUSTOMER_ID es requerido.')
    }

    const plate = this.normalizeIdentifier(payload.PLATE)
    const vin = this.normalizeIdentifier(payload.VIN)

    await this.assertCustomerAvailable(customerId, businessId)
    await this.assertUniqueVehicleIdentifiers(businessId, plate, vin)

    const vehicle = this.vehicleRepository.create({
      BUSINESS_ID: businessId,
      CUSTOMER_ID: customerId,
      PLATE: plate,
      VIN: vin,
      BRAND: payload.BRAND?.trim() || '',
      MODEL: payload.MODEL?.trim() || '',
      YEAR: this.normalizeYear(payload.YEAR),
      COLOR: payload.COLOR?.trim() || null,
      ENGINE: payload.ENGINE?.trim() || null,
      NOTES: payload.NOTES?.trim() || null,
      STATE: payload.STATE || 'A',
      CREATED_BY: sessionInfo.userId,
    })

    const saved = await this.vehicleRepository.save(vehicle)

    return this.success({
      data: await this.buildVehicleResponse(saved.VEHICLE_ID),
    })
  }

  @CatchServiceError()
  async update(
    payload: VehiclePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<VehicleResponse>> {
    const vehicleId = Number(payload.VEHICLE_ID)

    if (!vehicleId) {
      throw new BadRequestError('El campo VEHICLE_ID es requerido.')
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { VEHICLE_ID: vehicleId },
    })

    if (!vehicle) {
      throw new NotFoundError(`Vehículo con id '${vehicleId}' no encontrado.`)
    }

    const businessId = vehicle.BUSINESS_ID
    const customerId =
      payload.CUSTOMER_ID !== undefined
        ? Number(payload.CUSTOMER_ID)
        : vehicle.CUSTOMER_ID

    if (!customerId) {
      throw new BadRequestError('El campo CUSTOMER_ID es requerido.')
    }

    await this.assertCustomerAvailable(customerId, businessId)

    const plate =
      payload.PLATE !== undefined
        ? this.normalizeIdentifier(payload.PLATE)
        : vehicle.PLATE
    const vin =
      payload.VIN !== undefined
        ? this.normalizeIdentifier(payload.VIN)
        : vehicle.VIN

    await this.assertUniqueVehicleIdentifiers(businessId, plate, vin, vehicleId)

    if (payload.CUSTOMER_ID !== undefined) vehicle.CUSTOMER_ID = customerId
    if (payload.PLATE !== undefined) vehicle.PLATE = plate
    if (payload.VIN !== undefined) vehicle.VIN = vin
    if (payload.BRAND !== undefined) vehicle.BRAND = payload.BRAND?.trim() || ''
    if (payload.MODEL !== undefined) vehicle.MODEL = payload.MODEL?.trim() || ''
    if (payload.YEAR !== undefined) vehicle.YEAR = this.normalizeYear(payload.YEAR)
    if (payload.COLOR !== undefined) vehicle.COLOR = payload.COLOR?.trim() || null
    if (payload.ENGINE !== undefined)
      vehicle.ENGINE = payload.ENGINE?.trim() || null
    if (payload.NOTES !== undefined) vehicle.NOTES = payload.NOTES?.trim() || null
    if (payload.STATE) vehicle.STATE = payload.STATE

    vehicle.UPDATED_BY = sessionInfo.userId

    await this.vehicleRepository.save(vehicle)

    return this.success({
      data: await this.buildVehicleResponse(vehicle.VEHICLE_ID),
    })
  }

  @CatchServiceError()
  async getOne(vehicleId: number): Promise<ApiResponse<VehicleResponse>> {
    return this.success({
      data: await this.buildVehicleResponse(vehicleId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<Vehicle>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<VehicleResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    const qb = this.vehicleRepository
      .createQueryBuilder('v')
      .innerJoinAndSelect('v.CUSTOMER', 'c')
      .where('v.BUSINESS_ID = :businessId', { businessId })

    if (conditions.length) {
      this.applyConditions(qb, conditions)
    }

    qb.orderBy('"v"."VEHICLE_ID"', 'DESC')

    const { data, metadata } = await paginate(qb, pagination)
    const rows = data.map((item) => this.mapVehicle(item))

    return this.success({ data: rows, metadata })
  }

  private async buildVehicleResponse(vehicleId: number): Promise<VehicleResponse> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { VEHICLE_ID: vehicleId },
      relations: ['CUSTOMER'],
    })

    if (!vehicle) {
      throw new NotFoundError(`Vehículo con id '${vehicleId}' no encontrado.`)
    }

    return this.mapVehicle(vehicle)
  }

  private mapVehicle(vehicle: Vehicle): VehicleResponse {
    const customer = vehicle.CUSTOMER as Person | undefined
    const customerName = `${customer?.NAME || ''} ${customer?.LAST_NAME || ''}`
      .trim()
      .replace(/\s+/g, ' ')

    return {
      VEHICLE_ID: vehicle.VEHICLE_ID,
      CUSTOMER_ID: vehicle.CUSTOMER_ID,
      CUSTOMER_NAME: customerName,
      PLATE: vehicle.PLATE || '',
      VIN: vehicle.VIN || '',
      BRAND: vehicle.BRAND || '',
      MODEL: vehicle.MODEL || '',
      YEAR: vehicle.YEAR ?? null,
      COLOR: vehicle.COLOR || '',
      ENGINE: vehicle.ENGINE || '',
      NOTES: vehicle.NOTES || '',
      STATE: vehicle.STATE || 'A',
      CREATED_AT: vehicle.CREATED_AT,
    }
  }

  private normalizeIdentifier(value?: string | null): string | null {
    const normalized = value?.trim().toUpperCase() || null
    return normalized || null
  }

  private normalizeYear(value?: number | null): number | null {
    if (value === undefined || value === null || value === ('' as never)) {
      return null
    }

    const year = Number(value)

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new BadRequestError('YEAR debe estar entre 1900 y 2100.')
    }

    return year
  }

  private async assertCustomerAvailable(
    customerId: number,
    businessId: number
  ): Promise<void> {
    const customer = await this.personRepository.findOne({
      where: {
        PERSON_ID: customerId,
        BUSINESS_ID: businessId,
      },
      relations: ['STAFF'],
    })

    if (!customer) {
      throw new NotFoundError(`Cliente con id '${customerId}' no encontrado.`)
    }

    if (customer.STAFF) {
      throw new BadRequestError(
        `La persona con id '${customerId}' tiene acceso al sistema y no puede asignarse como cliente del vehículo.`
      )
    }

    if (customer.STATE !== 'A') {
      throw new BadRequestError(
        `El cliente con id '${customerId}' está inactivo y no puede asignarse al vehículo.`
      )
    }
  }

  private async assertUniqueVehicleIdentifiers(
    businessId: number,
    plate?: string | null,
    vin?: string | null,
    currentVehicleId?: number
  ): Promise<void> {
    if (plate) {
      const qb = this.vehicleRepository
        .createQueryBuilder('v')
        .where('v.BUSINESS_ID = :businessId', { businessId })
        .andWhere('UPPER(v.PLATE) = UPPER(:plate)', { plate })

      if (currentVehicleId) {
        qb.andWhere('v.VEHICLE_ID != :currentVehicleId', { currentVehicleId })
      }

      const exists = await qb.getOne()
      if (exists) {
        throw new DbConflictError(`La placa '${plate}' ya está registrada.`)
      }
    }

    if (vin) {
      const qb = this.vehicleRepository
        .createQueryBuilder('v')
        .where('v.BUSINESS_ID = :businessId', { businessId })
        .andWhere('UPPER(v.VIN) = UPPER(:vin)', { vin })

      if (currentVehicleId) {
        qb.andWhere('v.VEHICLE_ID != :currentVehicleId', { currentVehicleId })
      }

      const exists = await qb.getOne()
      if (exists) {
        throw new DbConflictError(`El VIN '${vin}' ya está registrado.`)
      }
    }
  }

  private applyConditions(
    qb: SelectQueryBuilder<Vehicle>,
    conditions: AdvancedCondition<Vehicle>[]
  ): void {
    conditions.forEach((condition, index) => {
      const operator = (condition.operator || '').toUpperCase()
      const paramName = `param_${index}`

      if (String(condition.field).toUpperCase() === 'FILTER') {
        const search = `%${condition.value}%`
        qb.andWhere(
          `
            UPPER(unaccent("v"."PLATE"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("v"."VIN"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("v"."BRAND"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("v"."MODEL"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("v"."COLOR"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("v"."ENGINE"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("c"."NAME"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("c"."LAST_NAME"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("c"."IDENTITY_DOCUMENT"::text)) LIKE UPPER(:${paramName})
          `,
          { [paramName]: search }
        )
        return
      }

      const fields = Array.isArray(condition.field)
        ? condition.field.map((item) => String(item))
        : [String(condition.field)]
      const columns = fields.map((field) => this.resolveColumn(field))
      const expression =
        columns.length > 1 ? columns.join(` || ' ' || `) : columns[0]

      switch (operator) {
        case '=':
        case '!=':
        case '<':
        case '<=':
        case '>':
        case '>=':
          qb.andWhere(`${expression} ${operator} :${paramName}`, {
            [paramName]: condition.value,
          })
          break
        case 'LIKE':
          qb.andWhere(
            `UPPER(unaccent(${expression}::text)) LIKE UPPER(:${paramName})`,
            {
              [paramName]: `%${condition.value}%`,
            }
          )
          break
        case 'IN':
        case 'NOT IN':
          if (!Array.isArray(condition.value)) {
            throw new BadRequestError(
              `El operador '${operator}' requiere un arreglo de valores.`
            )
          }
          qb.andWhere(`${columns[0]} ${operator} (:...${paramName})`, {
            [paramName]: condition.value,
          })
          break
        case 'BETWEEN':
          if (!Array.isArray(condition.value) || condition.value.length !== 2) {
            throw new BadRequestError(
              "El operador 'BETWEEN' requiere exactamente dos valores."
            )
          }
          qb.andWhere(
            `${columns[0]} BETWEEN :${paramName}_start AND :${paramName}_end`,
            {
              [`${paramName}_start`]: condition.value[0],
              [`${paramName}_end`]: condition.value[1],
            }
          )
          break
        case 'IS NULL':
          qb.andWhere(`${columns[0]} IS NULL`)
          break
        case 'IS NOT NULL':
          qb.andWhere(`${columns[0]} IS NOT NULL`)
          break
        default:
          throw new BadRequestError(
            `Operador '${condition.operator}' no soportado.`
          )
      }
    })
  }

  private resolveColumn(field: string): string {
    const normalized = field.toUpperCase()

    if (normalized === 'CUSTOMER_ID') return '"v"."CUSTOMER_ID"'
    if (normalized === 'CUSTOMER_NAME')
      return `"c"."NAME" || ' ' || COALESCE("c"."LAST_NAME", '')`

    return `"v"."${normalized}"`
  }
}
