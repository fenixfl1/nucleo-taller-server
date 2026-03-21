import { Repository } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'
import { ServiceVehicle } from '@entity/ServiceVehicle'
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
import { paginatedQuery } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'

type ServiceVehiclePayload = {
  SERVICE_VEHICLE_ID?: number
  NAME?: string
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

export type ServiceVehicleResponse = {
  SERVICE_VEHICLE_ID: number
  NAME: string
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

type ServiceVehiclePaginationRow = {
  SERVICE_VEHICLE_ID: number | string
  NAME: string | null
  PLATE: string | null
  VIN: string | null
  BRAND: string | null
  MODEL: string | null
  YEAR: number | string | null
  COLOR: string | null
  ENGINE: string | null
  NOTES: string | null
  STATE: string | null
  CREATED_AT: Date | null
}

export class ServiceVehicleService extends BaseService {
  private serviceVehicleRepository: Repository<ServiceVehicle>

  constructor() {
    super()
    this.serviceVehicleRepository = this.datasource.getRepository(ServiceVehicle)
  }

  @CatchServiceError()
  async create(
    payload: ServiceVehiclePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ServiceVehicleResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const plate = this.normalizeIdentifier(payload.PLATE)
    const vin = this.normalizeIdentifier(payload.VIN)

    await this.assertUniqueIdentifiers(businessId, plate, vin)

    const row = this.serviceVehicleRepository.create({
      BUSINESS_ID: businessId,
      NAME: this.normalizeRequiredText(payload.NAME, 'NAME'),
      PLATE: plate,
      VIN: vin,
      BRAND: this.normalizeRequiredText(payload.BRAND, 'BRAND'),
      MODEL: this.normalizeRequiredText(payload.MODEL, 'MODEL'),
      YEAR: this.normalizeYear(payload.YEAR),
      COLOR: payload.COLOR?.trim() || null,
      ENGINE: payload.ENGINE?.trim() || null,
      NOTES: payload.NOTES?.trim() || null,
      STATE: payload.STATE || 'A',
      CREATED_BY: sessionInfo.userId,
    })

    const saved = await this.serviceVehicleRepository.save(row)

    return this.success({
      data: await this.buildResponse(saved.SERVICE_VEHICLE_ID),
    })
  }

  @CatchServiceError()
  async update(
    payload: ServiceVehiclePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ServiceVehicleResponse>> {
    const serviceVehicleId = Number(payload.SERVICE_VEHICLE_ID)

    if (!serviceVehicleId) {
      throw new BadRequestError('El campo SERVICE_VEHICLE_ID es requerido.')
    }

    const row = await this.serviceVehicleRepository.findOne({
      where: { SERVICE_VEHICLE_ID: serviceVehicleId },
    })

    if (!row) {
      throw new NotFoundError(
        `Vehículo de servicio con id '${serviceVehicleId}' no encontrado.`
      )
    }

    const plate =
      payload.PLATE !== undefined
        ? this.normalizeIdentifier(payload.PLATE)
        : row.PLATE
    const vin =
      payload.VIN !== undefined ? this.normalizeIdentifier(payload.VIN) : row.VIN

    await this.assertUniqueIdentifiers(row.BUSINESS_ID, plate, vin, serviceVehicleId)

    if (payload.NAME !== undefined) {
      row.NAME = this.normalizeRequiredText(payload.NAME, 'NAME')
    }
    if (payload.PLATE !== undefined) row.PLATE = plate
    if (payload.VIN !== undefined) row.VIN = vin
    if (payload.BRAND !== undefined) {
      row.BRAND = this.normalizeRequiredText(payload.BRAND, 'BRAND')
    }
    if (payload.MODEL !== undefined) {
      row.MODEL = this.normalizeRequiredText(payload.MODEL, 'MODEL')
    }
    if (payload.YEAR !== undefined) row.YEAR = this.normalizeYear(payload.YEAR)
    if (payload.COLOR !== undefined) row.COLOR = payload.COLOR?.trim() || null
    if (payload.ENGINE !== undefined) row.ENGINE = payload.ENGINE?.trim() || null
    if (payload.NOTES !== undefined) row.NOTES = payload.NOTES?.trim() || null
    if (payload.STATE !== undefined) row.STATE = payload.STATE

    row.UPDATED_BY = sessionInfo.userId
    await this.serviceVehicleRepository.save(row)

    return this.success({
      data: await this.buildResponse(row.SERVICE_VEHICLE_ID),
    })
  }

  @CatchServiceError()
  async getOne(
    serviceVehicleId: number
  ): Promise<ApiResponse<ServiceVehicleResponse>> {
    return this.success({
      data: await this.buildResponse(serviceVehicleId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<ServiceVehicle>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<ServiceVehicleResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedConditions = preparePaginationConditions(conditions, [
      'NAME',
      'PLATE',
      'VIN',
      'BRAND',
      'MODEL',
      'COLOR',
      'ENGINE',
      'NOTES',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )

    const statement = `
      SELECT
        "SERVICE_VEHICLE_ID",
        "NAME",
        "PLATE",
        "VIN",
        "BRAND",
        "MODEL",
        "YEAR",
        "COLOR",
        "ENGINE",
        "NOTES",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "sv"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
          "sv"."NAME" AS "NAME",
          "sv"."PLATE" AS "PLATE",
          "sv"."VIN" AS "VIN",
          "sv"."BRAND" AS "BRAND",
          "sv"."MODEL" AS "MODEL",
          "sv"."YEAR" AS "YEAR",
          "sv"."COLOR" AS "COLOR",
          "sv"."ENGINE" AS "ENGINE",
          "sv"."NOTES" AS "NOTES",
          "sv"."STATE" AS "STATE",
          "sv"."CREATED_AT" AS "CREATED_AT"
        FROM "SERVICE_VEHICLE" "sv"
        WHERE "sv"."BUSINESS_ID" = ${Number(businessId)}
      ) AS "service_vehicle_rows"
      ${whereClause}
      ORDER BY "SERVICE_VEHICLE_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<ServiceVehiclePaginationRow>({
      statement,
      values,
      pagination,
    })

    return this.success({
      data: data.map((item) => this.mapPaginatedRow(item)),
      metadata,
    })
  }

  private async buildResponse(
    serviceVehicleId: number
  ): Promise<ServiceVehicleResponse> {
    const row = await this.serviceVehicleRepository.findOne({
      where: { SERVICE_VEHICLE_ID: serviceVehicleId },
    })

    if (!row) {
      throw new NotFoundError(
        `Vehículo de servicio con id '${serviceVehicleId}' no encontrado.`
      )
    }

    return this.mapRow(row)
  }

  private mapRow(row: ServiceVehicle): ServiceVehicleResponse {
    return {
      SERVICE_VEHICLE_ID: row.SERVICE_VEHICLE_ID,
      NAME: row.NAME || '',
      PLATE: row.PLATE || '',
      VIN: row.VIN || '',
      BRAND: row.BRAND || '',
      MODEL: row.MODEL || '',
      YEAR: row.YEAR ?? null,
      COLOR: row.COLOR || '',
      ENGINE: row.ENGINE || '',
      NOTES: row.NOTES || '',
      STATE: row.STATE || 'A',
      CREATED_AT: row.CREATED_AT,
    }
  }

  private mapPaginatedRow(
    row: ServiceVehiclePaginationRow
  ): ServiceVehicleResponse {
    return {
      SERVICE_VEHICLE_ID: Number(row.SERVICE_VEHICLE_ID),
      NAME: row.NAME || '',
      PLATE: row.PLATE || '',
      VIN: row.VIN || '',
      BRAND: row.BRAND || '',
      MODEL: row.MODEL || '',
      YEAR:
        row.YEAR === null || row.YEAR === undefined ? null : Number(row.YEAR),
      COLOR: row.COLOR || '',
      ENGINE: row.ENGINE || '',
      NOTES: row.NOTES || '',
      STATE: row.STATE || 'A',
      CREATED_AT: row.CREATED_AT || null,
    }
  }

  private normalizeRequiredText(value?: string, fieldName = 'CAMPO'): string {
    const normalized = value?.trim() || ''
    if (!normalized) {
      throw new BadRequestError(`El campo ${fieldName} es requerido.`)
    }
    return normalized
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

  private async assertUniqueIdentifiers(
    businessId: number,
    plate?: string | null,
    vin?: string | null,
    currentId?: number
  ): Promise<void> {
    if (plate) {
      const qb = this.serviceVehicleRepository
        .createQueryBuilder('sv')
        .where('sv.BUSINESS_ID = :businessId', { businessId })
        .andWhere('UPPER(sv.PLATE) = UPPER(:plate)', { plate })

      if (currentId) {
        qb.andWhere('sv.SERVICE_VEHICLE_ID != :currentId', { currentId })
      }

      const exists = await qb.getOne()
      if (exists) {
        throw new DbConflictError(`La placa '${plate}' ya está registrada.`)
      }
    }

    if (vin) {
      const qb = this.serviceVehicleRepository
        .createQueryBuilder('sv')
        .where('sv.BUSINESS_ID = :businessId', { businessId })
        .andWhere('UPPER(sv.VIN) = UPPER(:vin)', { vin })

      if (currentId) {
        qb.andWhere('sv.SERVICE_VEHICLE_ID != :currentId', { currentId })
      }

      const exists = await qb.getOne()
      if (exists) {
        throw new DbConflictError(`El VIN '${vin}' ya está registrado.`)
      }
    }
  }
}
