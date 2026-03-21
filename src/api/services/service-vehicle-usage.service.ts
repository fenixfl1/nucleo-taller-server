import { Repository } from 'typeorm'
import { ServiceVehicle } from '@entity/ServiceVehicle'
import { Staff } from '@entity/Staff'
import {
  ServiceVehicleUsage,
  ServiceVehicleUsageStatus,
} from '@entity/ServiceVehicleUsage'
import { BaseService, CatchServiceError } from './base.service'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import { BadRequestError, NotFoundError } from '@api/errors/http.error'
import { paginatedQuery, queryRunner } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'

type ServiceVehicleUsagePayload = {
  SERVICE_VEHICLE_USAGE_ID?: number
  SERVICE_VEHICLE_ID?: number
  STAFF_ID?: number | null
  STATUS?: ServiceVehicleUsageStatus
  PURPOSE?: string
  ORIGIN?: string | null
  DESTINATION?: string | null
  STARTED_AT?: string | Date | null
  ENDED_AT?: string | Date | null
  ODOMETER_START?: number | null
  ODOMETER_END?: number | null
  NOTES?: string | null
  STATE?: string
}

export type ServiceVehicleUsageResponse = {
  SERVICE_VEHICLE_USAGE_ID: number
  SERVICE_VEHICLE_ID: number
  STAFF_ID: number | null
  VEHICLE_NAME: string
  VEHICLE_LABEL: string
  EMPLOYEE_NAME: string
  STATUS: ServiceVehicleUsageStatus
  PURPOSE: string
  ORIGIN: string
  DESTINATION: string
  STARTED_AT: Date | null
  ENDED_AT: Date | null
  ODOMETER_START: number | null
  ODOMETER_END: number | null
  NOTES: string
  STATE: string
  CREATED_AT?: Date | null
}

type ServiceVehicleUsagePaginationRow = {
  SERVICE_VEHICLE_USAGE_ID: number | string
  SERVICE_VEHICLE_ID: number | string
  STAFF_ID: number | string | null
  VEHICLE_NAME: string | null
  VEHICLE_LABEL: string | null
  EMPLOYEE_NAME: string | null
  STATUS: ServiceVehicleUsageStatus | null
  PURPOSE: string | null
  ORIGIN: string | null
  DESTINATION: string | null
  STARTED_AT: Date | string | null
  ENDED_AT: Date | string | null
  ODOMETER_START: number | string | null
  ODOMETER_END: number | string | null
  NOTES: string | null
  STATE: string | null
  CREATED_AT: Date | string | null
}

export class ServiceVehicleUsageService extends BaseService {
  private usageRepository: Repository<ServiceVehicleUsage>
  private serviceVehicleRepository: Repository<ServiceVehicle>
  private staffRepositoryLocal: Repository<Staff>

  constructor() {
    super()
    this.usageRepository = this.datasource.getRepository(ServiceVehicleUsage)
    this.serviceVehicleRepository = this.datasource.getRepository(ServiceVehicle)
    this.staffRepositoryLocal = this.datasource.getRepository(Staff)
  }

  @CatchServiceError()
  async create(
    payload: ServiceVehicleUsagePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ServiceVehicleUsageResponse>> {
    const businessId = Number((await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID)
    const serviceVehicleId = Number(payload.SERVICE_VEHICLE_ID)

    if (!serviceVehicleId) {
      throw new BadRequestError('SERVICE_VEHICLE_ID es requerido.')
    }

    const vehicle = await this.assertServiceVehicleExists(serviceVehicleId, businessId)
    const staffId = await this.resolveStaffId(payload.STAFF_ID, businessId)

    const row = this.usageRepository.create({
      BUSINESS_ID: businessId,
      SERVICE_VEHICLE_ID: serviceVehicleId,
      STAFF_ID: staffId,
      STATUS: this.normalizeStatus(payload.STATUS),
      PURPOSE: this.normalizeRequiredText(payload.PURPOSE, 'PURPOSE'),
      ORIGIN: payload.ORIGIN?.trim() || null,
      DESTINATION: payload.DESTINATION?.trim() || null,
      STARTED_AT: this.normalizeRequiredDate(payload.STARTED_AT, 'STARTED_AT'),
      ENDED_AT: this.normalizeDate(payload.ENDED_AT),
      ODOMETER_START: this.normalizeInteger(payload.ODOMETER_START, 'ODOMETER_START'),
      ODOMETER_END: this.normalizeInteger(payload.ODOMETER_END, 'ODOMETER_END'),
      NOTES: payload.NOTES?.trim() || null,
      STATE: payload.STATE || 'A',
      CREATED_BY: sessionInfo.userId,
    })

    await this.applyUsageRules(row, vehicle)
    const saved = await this.usageRepository.save(row)

    return this.success({
      data: await this.buildResponse(saved.SERVICE_VEHICLE_USAGE_ID),
    })
  }

  @CatchServiceError()
  async update(
    payload: ServiceVehicleUsagePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ServiceVehicleUsageResponse>> {
    const usageId = Number(payload.SERVICE_VEHICLE_USAGE_ID)
    if (!usageId) {
      throw new BadRequestError('SERVICE_VEHICLE_USAGE_ID es requerido.')
    }

    const row = await this.usageRepository.findOne({
      where: { SERVICE_VEHICLE_USAGE_ID: usageId },
    })

    if (!row) {
      throw new NotFoundError(`Uso con id '${usageId}' no encontrado.`)
    }

    let vehicle = await this.assertServiceVehicleExists(
      row.SERVICE_VEHICLE_ID,
      row.BUSINESS_ID
    )

    if (payload.SERVICE_VEHICLE_ID !== undefined) {
      const serviceVehicleId = Number(payload.SERVICE_VEHICLE_ID)
      if (!serviceVehicleId) {
        throw new BadRequestError('SERVICE_VEHICLE_ID es inválido.')
      }
      vehicle = await this.assertServiceVehicleExists(serviceVehicleId, row.BUSINESS_ID)
      row.SERVICE_VEHICLE_ID = serviceVehicleId
    }

    if (payload.STAFF_ID !== undefined) {
      row.STAFF_ID = await this.resolveStaffId(payload.STAFF_ID, row.BUSINESS_ID)
    }
    if (payload.STATUS !== undefined) {
      row.STATUS = this.normalizeStatus(payload.STATUS)
    }
    if (payload.PURPOSE !== undefined) {
      row.PURPOSE = this.normalizeRequiredText(payload.PURPOSE, 'PURPOSE')
    }
    if (payload.ORIGIN !== undefined) {
      row.ORIGIN = payload.ORIGIN?.trim() || null
    }
    if (payload.DESTINATION !== undefined) {
      row.DESTINATION = payload.DESTINATION?.trim() || null
    }
    if (payload.STARTED_AT !== undefined) {
      row.STARTED_AT = this.normalizeRequiredDate(payload.STARTED_AT, 'STARTED_AT')
    }
    if (payload.ENDED_AT !== undefined) {
      row.ENDED_AT = this.normalizeDate(payload.ENDED_AT)
    }
    if (payload.ODOMETER_START !== undefined) {
      row.ODOMETER_START = this.normalizeInteger(
        payload.ODOMETER_START,
        'ODOMETER_START'
      )
    }
    if (payload.ODOMETER_END !== undefined) {
      row.ODOMETER_END = this.normalizeInteger(
        payload.ODOMETER_END,
        'ODOMETER_END'
      )
    }
    if (payload.NOTES !== undefined) {
      row.NOTES = payload.NOTES?.trim() || null
    }
    if (payload.STATE !== undefined) {
      row.STATE = payload.STATE
    }

    await this.applyUsageRules(row, vehicle)
    row.UPDATED_BY = sessionInfo.userId
    await this.usageRepository.save(row)

    return this.success({
      data: await this.buildResponse(row.SERVICE_VEHICLE_USAGE_ID),
    })
  }

  @CatchServiceError()
  async getOne(
    usageId: number
  ): Promise<ApiResponse<ServiceVehicleUsageResponse>> {
    return this.success({
      data: await this.buildResponse(usageId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<ServiceVehicleUsage>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<ServiceVehicleUsageResponse[]>> {
    const businessId = Number((await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID)
    const normalizedConditions = preparePaginationConditions(conditions, [
      'PURPOSE',
      'ORIGIN',
      'DESTINATION',
      'NOTES',
      'VEHICLE_NAME',
      'VEHICLE_LABEL',
      'EMPLOYEE_NAME',
      'STATUS',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )

    const statement = `
      SELECT
        "SERVICE_VEHICLE_USAGE_ID",
        "SERVICE_VEHICLE_ID",
        "STAFF_ID",
        "VEHICLE_NAME",
        "VEHICLE_LABEL",
        "EMPLOYEE_NAME",
        "STATUS",
        "PURPOSE",
        "ORIGIN",
        "DESTINATION",
        "STARTED_AT",
        "ENDED_AT",
        "ODOMETER_START",
        "ODOMETER_END",
        "NOTES",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "u"."SERVICE_VEHICLE_USAGE_ID" AS "SERVICE_VEHICLE_USAGE_ID",
          "u"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
          "u"."STAFF_ID" AS "STAFF_ID",
          "sv"."NAME" AS "VEHICLE_NAME",
          TRIM(CONCAT(COALESCE("sv"."NAME", ''), ' · ', COALESCE("sv"."PLATE", ''), ' ', COALESCE("sv"."BRAND", ''), ' ', COALESCE("sv"."MODEL", ''))) AS "VEHICLE_LABEL",
          TRIM(CONCAT(COALESCE("p"."NAME", ''), ' ', COALESCE("p"."LAST_NAME", ''), CASE WHEN "s"."USERNAME" IS NOT NULL AND TRIM("s"."USERNAME") <> '' THEN CONCAT(' (@', "s"."USERNAME", ')') ELSE '' END)) AS "EMPLOYEE_NAME",
          "u"."STATUS" AS "STATUS",
          "u"."PURPOSE" AS "PURPOSE",
          "u"."ORIGIN" AS "ORIGIN",
          "u"."DESTINATION" AS "DESTINATION",
          "u"."STARTED_AT" AS "STARTED_AT",
          "u"."ENDED_AT" AS "ENDED_AT",
          "u"."ODOMETER_START" AS "ODOMETER_START",
          "u"."ODOMETER_END" AS "ODOMETER_END",
          "u"."NOTES" AS "NOTES",
          "u"."STATE" AS "STATE",
          "u"."CREATED_AT" AS "CREATED_AT"
        FROM "SERVICE_VEHICLE_USAGE" "u"
        INNER JOIN "SERVICE_VEHICLE" "sv"
          ON "sv"."SERVICE_VEHICLE_ID" = "u"."SERVICE_VEHICLE_ID"
        LEFT JOIN "STAFF" "s"
          ON "s"."STAFF_ID" = "u"."STAFF_ID"
        LEFT JOIN "PERSON" "p"
          ON "p"."PERSON_ID" = "s"."PERSON_ID"
        WHERE "u"."BUSINESS_ID" = ${businessId}
      ) AS "service_vehicle_usage_rows"
      ${whereClause}
      ORDER BY COALESCE("ENDED_AT", "STARTED_AT") DESC, "SERVICE_VEHICLE_USAGE_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<ServiceVehicleUsagePaginationRow>({
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
    usageId: number
  ): Promise<ServiceVehicleUsageResponse> {
    const rows = await queryRunner<ServiceVehicleUsagePaginationRow>(
      `
        SELECT
          "u"."SERVICE_VEHICLE_USAGE_ID" AS "SERVICE_VEHICLE_USAGE_ID",
          "u"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
          "u"."STAFF_ID" AS "STAFF_ID",
          "sv"."NAME" AS "VEHICLE_NAME",
          TRIM(CONCAT(COALESCE("sv"."NAME", ''), ' · ', COALESCE("sv"."PLATE", ''), ' ', COALESCE("sv"."BRAND", ''), ' ', COALESCE("sv"."MODEL", ''))) AS "VEHICLE_LABEL",
          TRIM(CONCAT(COALESCE("p"."NAME", ''), ' ', COALESCE("p"."LAST_NAME", ''), CASE WHEN "s"."USERNAME" IS NOT NULL AND TRIM("s"."USERNAME") <> '' THEN CONCAT(' (@', "s"."USERNAME", ')') ELSE '' END)) AS "EMPLOYEE_NAME",
          "u"."STATUS" AS "STATUS",
          "u"."PURPOSE" AS "PURPOSE",
          "u"."ORIGIN" AS "ORIGIN",
          "u"."DESTINATION" AS "DESTINATION",
          "u"."STARTED_AT" AS "STARTED_AT",
          "u"."ENDED_AT" AS "ENDED_AT",
          "u"."ODOMETER_START" AS "ODOMETER_START",
          "u"."ODOMETER_END" AS "ODOMETER_END",
          "u"."NOTES" AS "NOTES",
          "u"."STATE" AS "STATE",
          "u"."CREATED_AT" AS "CREATED_AT"
        FROM "SERVICE_VEHICLE_USAGE" "u"
        INNER JOIN "SERVICE_VEHICLE" "sv"
          ON "sv"."SERVICE_VEHICLE_ID" = "u"."SERVICE_VEHICLE_ID"
        LEFT JOIN "STAFF" "s"
          ON "s"."STAFF_ID" = "u"."STAFF_ID"
        LEFT JOIN "PERSON" "p"
          ON "p"."PERSON_ID" = "s"."PERSON_ID"
        WHERE "u"."SERVICE_VEHICLE_USAGE_ID" = $1
        LIMIT 1
      `,
      [usageId]
    )

    const item = rows[0]
    if (!item) {
      throw new NotFoundError(`Uso con id '${usageId}' no encontrado.`)
    }

    return this.mapPaginatedRow(item)
  }

  private mapPaginatedRow(
    row: ServiceVehicleUsagePaginationRow
  ): ServiceVehicleUsageResponse {
    return {
      SERVICE_VEHICLE_USAGE_ID: Number(row.SERVICE_VEHICLE_USAGE_ID),
      SERVICE_VEHICLE_ID: Number(row.SERVICE_VEHICLE_ID),
      STAFF_ID: row.STAFF_ID == null ? null : Number(row.STAFF_ID),
      VEHICLE_NAME: row.VEHICLE_NAME || '',
      VEHICLE_LABEL: row.VEHICLE_LABEL || '',
      EMPLOYEE_NAME: row.EMPLOYEE_NAME || '',
      STATUS: (row.STATUS || 'EN_CURSO') as ServiceVehicleUsageStatus,
      PURPOSE: row.PURPOSE || '',
      ORIGIN: row.ORIGIN || '',
      DESTINATION: row.DESTINATION || '',
      STARTED_AT: row.STARTED_AT ? new Date(row.STARTED_AT) : null,
      ENDED_AT: row.ENDED_AT ? new Date(row.ENDED_AT) : null,
      ODOMETER_START:
        row.ODOMETER_START == null ? null : Number(row.ODOMETER_START),
      ODOMETER_END:
        row.ODOMETER_END == null ? null : Number(row.ODOMETER_END),
      NOTES: row.NOTES || '',
      STATE: row.STATE || 'A',
      CREATED_AT: row.CREATED_AT ? new Date(row.CREATED_AT) : null,
    }
  }

  private async assertServiceVehicleExists(
    serviceVehicleId: number,
    businessId: number
  ): Promise<ServiceVehicle> {
    const row = await this.serviceVehicleRepository.findOne({
      where: {
        SERVICE_VEHICLE_ID: serviceVehicleId,
        BUSINESS_ID: businessId,
      },
    })

    if (!row) {
      throw new NotFoundError(
        `Vehículo de servicio con id '${serviceVehicleId}' no encontrado.`
      )
    }

    return row
  }

  private async resolveStaffId(
    staffId: number | null | undefined,
    businessId: number
  ): Promise<number | null> {
    if (!staffId) return null

    const row = await this.staffRepositoryLocal.findOne({
      where: {
        STAFF_ID: Number(staffId),
        BUSINESS_ID: businessId,
      },
    })

    if (!row) {
      throw new NotFoundError(`Empleado con id '${staffId}' no encontrado.`)
    }

    return row.STAFF_ID
  }

  private normalizeRequiredText(value?: string, fieldName = 'CAMPO'): string {
    const normalized = value?.trim() || ''
    if (!normalized) {
      throw new BadRequestError(`El campo ${fieldName} es requerido.`)
    }
    return normalized
  }

  private normalizeStatus(
    value?: ServiceVehicleUsageStatus
  ): ServiceVehicleUsageStatus {
    const normalized = value || 'EN_CURSO'
    const validValues: ServiceVehicleUsageStatus[] = [
      'EN_CURSO',
      'FINALIZADA',
      'CANCELADA',
    ]
    if (!validValues.includes(normalized)) {
      throw new BadRequestError('STATUS es inválido.')
    }
    return normalized
  }

  private normalizeDate(value?: string | Date | null): Date | null {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('La fecha indicada es inválida.')
    }
    return date
  }

  private normalizeRequiredDate(
    value?: string | Date | null,
    fieldName = 'FECHA'
  ): Date {
    const date = this.normalizeDate(value)
    if (!date) {
      throw new BadRequestError(`El campo ${fieldName} es requerido.`)
    }
    return date
  }

  private normalizeInteger(
    value?: number | null,
    fieldName = 'CAMPO'
  ): number | null {
    if (value === undefined || value === null || value === ('' as never)) {
      return null
    }

    const numeric = Number(value)
    if (!Number.isInteger(numeric) || numeric < 0) {
      throw new BadRequestError(`${fieldName} debe ser un entero positivo.`)
    }

    return numeric
  }

  private async applyUsageRules(
    row: ServiceVehicleUsage,
    vehicle: ServiceVehicle
  ): Promise<void> {
    if (vehicle.STATE !== 'A' && row.STATUS !== 'CANCELADA') {
      throw new BadRequestError(
        'No se puede registrar uso sobre un vehículo de servicio inactivo.'
      )
    }

    if (row.ENDED_AT && row.ENDED_AT.getTime() < row.STARTED_AT.getTime()) {
      throw new BadRequestError('ENDED_AT no puede ser menor que STARTED_AT.')
    }

    if (
      row.ODOMETER_START !== null &&
      row.ODOMETER_END !== null &&
      row.ODOMETER_END < row.ODOMETER_START
    ) {
      throw new BadRequestError(
        'ODOMETER_END no puede ser menor que ODOMETER_START.'
      )
    }

    if (row.STATUS === 'FINALIZADA' && !row.ENDED_AT) {
      row.ENDED_AT = new Date()
    }

    if (row.STATUS === 'EN_CURSO' && row.ENDED_AT) {
      throw new BadRequestError(
        'ENDED_AT solo debe definirse cuando el uso está finalizado o cancelado.'
      )
    }

    if (row.STATUS === 'EN_CURSO') {
      const query = this.usageRepository
        .createQueryBuilder('u')
        .where('u.SERVICE_VEHICLE_ID = :serviceVehicleId', {
          serviceVehicleId: row.SERVICE_VEHICLE_ID,
        })
        .andWhere('u.STATUS = :status', { status: 'EN_CURSO' })
        .andWhere('u.STATE = :state', { state: 'A' })

      if (row.SERVICE_VEHICLE_USAGE_ID) {
        query.andWhere('u.SERVICE_VEHICLE_USAGE_ID != :usageId', {
          usageId: row.SERVICE_VEHICLE_USAGE_ID,
        })
      }

      const conflict = await query.getOne()

      if (conflict) {
        throw new BadRequestError(
          'Ya existe una salida/uso en curso para este vehículo de servicio.'
        )
      }
    }
  }
}
