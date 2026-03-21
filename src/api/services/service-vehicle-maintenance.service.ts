import { Repository } from 'typeorm'
import { ServiceVehicle } from '@entity/ServiceVehicle'
import {
  ServiceVehicleMaintenance,
  ServiceVehicleMaintenancePriority,
  ServiceVehicleMaintenanceStatus,
  ServiceVehicleMaintenanceType,
} from '@entity/ServiceVehicleMaintenance'
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

type ServiceVehicleMaintenancePayload = {
  SERVICE_VEHICLE_MAINTENANCE_ID?: number
  SERVICE_VEHICLE_ID?: number
  MAINTENANCE_TYPE?: ServiceVehicleMaintenanceType
  PRIORITY?: ServiceVehicleMaintenancePriority
  STATUS?: ServiceVehicleMaintenanceStatus
  TITLE?: string
  DESCRIPTION?: string | null
  SCHEDULED_AT?: string | Date | null
  PERFORMED_AT?: string | Date | null
  ODOMETER?: number | null
  COST_REFERENCE?: number | null
  NOTES?: string | null
  STATE?: string
}

export type ServiceVehicleMaintenanceResponse = {
  SERVICE_VEHICLE_MAINTENANCE_ID: number
  SERVICE_VEHICLE_ID: number
  VEHICLE_NAME: string
  VEHICLE_LABEL: string
  MAINTENANCE_TYPE: ServiceVehicleMaintenanceType
  PRIORITY: ServiceVehicleMaintenancePriority
  STATUS: ServiceVehicleMaintenanceStatus
  TITLE: string
  DESCRIPTION: string
  SCHEDULED_AT: Date | null
  PERFORMED_AT: Date | null
  ODOMETER: number | null
  COST_REFERENCE: number | null
  NOTES: string
  STATE: string
  CREATED_AT?: Date | null
}

type ServiceVehicleMaintenancePaginationRow = {
  SERVICE_VEHICLE_MAINTENANCE_ID: number | string
  SERVICE_VEHICLE_ID: number | string
  VEHICLE_NAME: string | null
  VEHICLE_LABEL: string | null
  MAINTENANCE_TYPE: ServiceVehicleMaintenanceType | null
  PRIORITY: ServiceVehicleMaintenancePriority | null
  STATUS: ServiceVehicleMaintenanceStatus | null
  TITLE: string | null
  DESCRIPTION: string | null
  SCHEDULED_AT: Date | string | null
  PERFORMED_AT: Date | string | null
  ODOMETER: number | string | null
  COST_REFERENCE: number | string | null
  NOTES: string | null
  STATE: string | null
  CREATED_AT: Date | string | null
}

export class ServiceVehicleMaintenanceService extends BaseService {
  private maintenanceRepository: Repository<ServiceVehicleMaintenance>
  private serviceVehicleRepository: Repository<ServiceVehicle>

  constructor() {
    super()
    this.maintenanceRepository = this.datasource.getRepository(
      ServiceVehicleMaintenance
    )
    this.serviceVehicleRepository = this.datasource.getRepository(ServiceVehicle)
  }

  @CatchServiceError()
  async create(
    payload: ServiceVehicleMaintenancePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ServiceVehicleMaintenanceResponse>> {
    const businessId = Number(
      (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    )
    const serviceVehicleId = Number(payload.SERVICE_VEHICLE_ID)

    if (!serviceVehicleId) {
      throw new BadRequestError('SERVICE_VEHICLE_ID es requerido.')
    }

    await this.assertServiceVehicleExists(serviceVehicleId, businessId)

    const row = this.maintenanceRepository.create({
      BUSINESS_ID: businessId,
      SERVICE_VEHICLE_ID: serviceVehicleId,
      MAINTENANCE_TYPE: this.normalizeMaintenanceType(payload.MAINTENANCE_TYPE),
      PRIORITY: this.normalizePriority(payload.PRIORITY),
      STATUS: this.normalizeStatus(payload.STATUS),
      TITLE: this.normalizeRequiredText(payload.TITLE, 'TITLE'),
      DESCRIPTION: payload.DESCRIPTION?.trim() || null,
      SCHEDULED_AT: this.normalizeDate(payload.SCHEDULED_AT),
      PERFORMED_AT: this.normalizeDate(payload.PERFORMED_AT),
      ODOMETER: this.normalizeInteger(payload.ODOMETER, 'ODOMETER'),
      COST_REFERENCE: this.normalizeDecimal(
        payload.COST_REFERENCE,
        'COST_REFERENCE'
      ),
      NOTES: payload.NOTES?.trim() || null,
      STATE: payload.STATE || 'A',
      CREATED_BY: sessionInfo.userId,
    })

    this.applyStatusRules(row)
    const saved = await this.maintenanceRepository.save(row)

    return this.success({
      data: await this.buildResponse(saved.SERVICE_VEHICLE_MAINTENANCE_ID),
    })
  }

  @CatchServiceError()
  async update(
    payload: ServiceVehicleMaintenancePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ServiceVehicleMaintenanceResponse>> {
    const maintenanceId = Number(payload.SERVICE_VEHICLE_MAINTENANCE_ID)

    if (!maintenanceId) {
      throw new BadRequestError(
        'SERVICE_VEHICLE_MAINTENANCE_ID es requerido.'
      )
    }

    const row = await this.maintenanceRepository.findOne({
      where: { SERVICE_VEHICLE_MAINTENANCE_ID: maintenanceId },
    })

    if (!row) {
      throw new NotFoundError(
        `Mantenimiento con id '${maintenanceId}' no encontrado.`
      )
    }

    if (payload.SERVICE_VEHICLE_ID !== undefined) {
      const serviceVehicleId = Number(payload.SERVICE_VEHICLE_ID)
      if (!serviceVehicleId) {
        throw new BadRequestError('SERVICE_VEHICLE_ID es inválido.')
      }
      await this.assertServiceVehicleExists(serviceVehicleId, row.BUSINESS_ID)
      row.SERVICE_VEHICLE_ID = serviceVehicleId
    }

    if (payload.MAINTENANCE_TYPE !== undefined) {
      row.MAINTENANCE_TYPE = this.normalizeMaintenanceType(
        payload.MAINTENANCE_TYPE
      )
    }
    if (payload.PRIORITY !== undefined) {
      row.PRIORITY = this.normalizePriority(payload.PRIORITY)
    }
    if (payload.STATUS !== undefined) {
      row.STATUS = this.normalizeStatus(payload.STATUS)
    }
    if (payload.TITLE !== undefined) {
      row.TITLE = this.normalizeRequiredText(payload.TITLE, 'TITLE')
    }
    if (payload.DESCRIPTION !== undefined) {
      row.DESCRIPTION = payload.DESCRIPTION?.trim() || null
    }
    if (payload.SCHEDULED_AT !== undefined) {
      row.SCHEDULED_AT = this.normalizeDate(payload.SCHEDULED_AT)
    }
    if (payload.PERFORMED_AT !== undefined) {
      row.PERFORMED_AT = this.normalizeDate(payload.PERFORMED_AT)
    }
    if (payload.ODOMETER !== undefined) {
      row.ODOMETER = this.normalizeInteger(payload.ODOMETER, 'ODOMETER')
    }
    if (payload.COST_REFERENCE !== undefined) {
      row.COST_REFERENCE = this.normalizeDecimal(
        payload.COST_REFERENCE,
        'COST_REFERENCE'
      )
    }
    if (payload.NOTES !== undefined) {
      row.NOTES = payload.NOTES?.trim() || null
    }
    if (payload.STATE !== undefined) {
      row.STATE = payload.STATE
    }

    this.applyStatusRules(row)
    row.UPDATED_BY = sessionInfo.userId
    await this.maintenanceRepository.save(row)

    return this.success({
      data: await this.buildResponse(row.SERVICE_VEHICLE_MAINTENANCE_ID),
    })
  }

  @CatchServiceError()
  async getOne(
    maintenanceId: number
  ): Promise<ApiResponse<ServiceVehicleMaintenanceResponse>> {
    return this.success({
      data: await this.buildResponse(maintenanceId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<ServiceVehicleMaintenance>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<ServiceVehicleMaintenanceResponse[]>> {
    const businessId = Number(
      (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    )
    const normalizedConditions = preparePaginationConditions(conditions, [
      'TITLE',
      'DESCRIPTION',
      'NOTES',
      'VEHICLE_NAME',
      'VEHICLE_LABEL',
      'MAINTENANCE_TYPE',
      'PRIORITY',
      'STATUS',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )

    const statement = `
      SELECT
        "SERVICE_VEHICLE_MAINTENANCE_ID",
        "SERVICE_VEHICLE_ID",
        "VEHICLE_NAME",
        "VEHICLE_LABEL",
        "MAINTENANCE_TYPE",
        "PRIORITY",
        "STATUS",
        "TITLE",
        "DESCRIPTION",
        "SCHEDULED_AT",
        "PERFORMED_AT",
        "ODOMETER",
        "COST_REFERENCE",
        "NOTES",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "m"."SERVICE_VEHICLE_MAINTENANCE_ID" AS "SERVICE_VEHICLE_MAINTENANCE_ID",
          "m"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
          "sv"."NAME" AS "VEHICLE_NAME",
          TRIM(CONCAT(COALESCE("sv"."NAME", ''), ' · ', COALESCE("sv"."PLATE", ''), ' ', COALESCE("sv"."BRAND", ''), ' ', COALESCE("sv"."MODEL", ''))) AS "VEHICLE_LABEL",
          "m"."MAINTENANCE_TYPE" AS "MAINTENANCE_TYPE",
          "m"."PRIORITY" AS "PRIORITY",
          "m"."STATUS" AS "STATUS",
          "m"."TITLE" AS "TITLE",
          "m"."DESCRIPTION" AS "DESCRIPTION",
          "m"."SCHEDULED_AT" AS "SCHEDULED_AT",
          "m"."PERFORMED_AT" AS "PERFORMED_AT",
          "m"."ODOMETER" AS "ODOMETER",
          "m"."COST_REFERENCE" AS "COST_REFERENCE",
          "m"."NOTES" AS "NOTES",
          "m"."STATE" AS "STATE",
          "m"."CREATED_AT" AS "CREATED_AT"
        FROM "SERVICE_VEHICLE_MAINTENANCE" "m"
        INNER JOIN "SERVICE_VEHICLE" "sv"
          ON "sv"."SERVICE_VEHICLE_ID" = "m"."SERVICE_VEHICLE_ID"
        WHERE "m"."BUSINESS_ID" = ${businessId}
      ) AS "service_vehicle_maintenance_rows"
      ${whereClause}
      ORDER BY COALESCE("SCHEDULED_AT", "CREATED_AT") DESC, "SERVICE_VEHICLE_MAINTENANCE_ID" DESC
    `

    const [data, metadata] =
      await paginatedQuery<ServiceVehicleMaintenancePaginationRow>({
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
    maintenanceId: number
  ): Promise<ServiceVehicleMaintenanceResponse> {
    const rows = await queryRunner<ServiceVehicleMaintenancePaginationRow>(
      `
        SELECT
          "m"."SERVICE_VEHICLE_MAINTENANCE_ID" AS "SERVICE_VEHICLE_MAINTENANCE_ID",
          "m"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
          "sv"."NAME" AS "VEHICLE_NAME",
          TRIM(CONCAT(COALESCE("sv"."NAME", ''), ' · ', COALESCE("sv"."PLATE", ''), ' ', COALESCE("sv"."BRAND", ''), ' ', COALESCE("sv"."MODEL", ''))) AS "VEHICLE_LABEL",
          "m"."MAINTENANCE_TYPE" AS "MAINTENANCE_TYPE",
          "m"."PRIORITY" AS "PRIORITY",
          "m"."STATUS" AS "STATUS",
          "m"."TITLE" AS "TITLE",
          "m"."DESCRIPTION" AS "DESCRIPTION",
          "m"."SCHEDULED_AT" AS "SCHEDULED_AT",
          "m"."PERFORMED_AT" AS "PERFORMED_AT",
          "m"."ODOMETER" AS "ODOMETER",
          "m"."COST_REFERENCE" AS "COST_REFERENCE",
          "m"."NOTES" AS "NOTES",
          "m"."STATE" AS "STATE",
          "m"."CREATED_AT" AS "CREATED_AT"
        FROM "SERVICE_VEHICLE_MAINTENANCE" "m"
        INNER JOIN "SERVICE_VEHICLE" "sv"
          ON "sv"."SERVICE_VEHICLE_ID" = "m"."SERVICE_VEHICLE_ID"
        WHERE "m"."SERVICE_VEHICLE_MAINTENANCE_ID" = $1
        LIMIT 1
      `,
      [maintenanceId]
    )

    const item = rows[0]
    if (!item) {
      throw new NotFoundError(
        `Mantenimiento con id '${maintenanceId}' no encontrado.`
      )
    }

    return this.mapPaginatedRow(item)
  }

  private mapPaginatedRow(
    row: ServiceVehicleMaintenancePaginationRow
  ): ServiceVehicleMaintenanceResponse {
    return {
      SERVICE_VEHICLE_MAINTENANCE_ID: Number(
        row.SERVICE_VEHICLE_MAINTENANCE_ID
      ),
      SERVICE_VEHICLE_ID: Number(row.SERVICE_VEHICLE_ID),
      VEHICLE_NAME: row.VEHICLE_NAME || '',
      VEHICLE_LABEL: row.VEHICLE_LABEL || '',
      MAINTENANCE_TYPE:
        (row.MAINTENANCE_TYPE || 'OTRO') as ServiceVehicleMaintenanceType,
      PRIORITY: (row.PRIORITY || 'MEDIA') as ServiceVehicleMaintenancePriority,
      STATUS: (row.STATUS || 'PENDIENTE') as ServiceVehicleMaintenanceStatus,
      TITLE: row.TITLE || '',
      DESCRIPTION: row.DESCRIPTION || '',
      SCHEDULED_AT: row.SCHEDULED_AT ? new Date(row.SCHEDULED_AT) : null,
      PERFORMED_AT: row.PERFORMED_AT ? new Date(row.PERFORMED_AT) : null,
      ODOMETER: row.ODOMETER == null ? null : Number(row.ODOMETER),
      COST_REFERENCE:
        row.COST_REFERENCE == null ? null : Number(row.COST_REFERENCE),
      NOTES: row.NOTES || '',
      STATE: row.STATE || 'A',
      CREATED_AT: row.CREATED_AT ? new Date(row.CREATED_AT) : null,
    }
  }

  private async assertServiceVehicleExists(
    serviceVehicleId: number,
    businessId: number
  ): Promise<void> {
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
  }

  private normalizeRequiredText(value?: string, fieldName = 'CAMPO'): string {
    const normalized = value?.trim() || ''
    if (!normalized) {
      throw new BadRequestError(`El campo ${fieldName} es requerido.`)
    }
    return normalized
  }

  private normalizeMaintenanceType(
    value?: ServiceVehicleMaintenanceType
  ): ServiceVehicleMaintenanceType {
    const normalized = value || 'OTRO'
    const validValues: ServiceVehicleMaintenanceType[] = [
      'PREVENTIVO',
      'CORRECTIVO',
      'INSPECCION',
      'CAMBIO_PIEZA',
      'OTRO',
    ]
    if (!validValues.includes(normalized)) {
      throw new BadRequestError('MAINTENANCE_TYPE es inválido.')
    }
    return normalized
  }

  private normalizePriority(
    value?: ServiceVehicleMaintenancePriority
  ): ServiceVehicleMaintenancePriority {
    const normalized = value || 'MEDIA'
    const validValues: ServiceVehicleMaintenancePriority[] = [
      'BAJA',
      'MEDIA',
      'ALTA',
    ]
    if (!validValues.includes(normalized)) {
      throw new BadRequestError('PRIORITY es inválido.')
    }
    return normalized
  }

  private normalizeStatus(
    value?: ServiceVehicleMaintenanceStatus
  ): ServiceVehicleMaintenanceStatus {
    const normalized = value || 'PENDIENTE'
    const validValues: ServiceVehicleMaintenanceStatus[] = [
      'PENDIENTE',
      'EN_PROCESO',
      'COMPLETADO',
      'CANCELADO',
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

  private normalizeDecimal(
    value?: number | null,
    fieldName = 'CAMPO'
  ): number | null {
    if (value === undefined || value === null || value === ('' as never)) {
      return null
    }

    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new BadRequestError(`${fieldName} debe ser un valor positivo.`)
    }

    return Number(numeric.toFixed(2))
  }

  private applyStatusRules(row: ServiceVehicleMaintenance): void {
    if (row.STATUS === 'COMPLETADO' && !row.PERFORMED_AT) {
      row.PERFORMED_AT = new Date()
    }

    if (
      row.PERFORMED_AT &&
      row.SCHEDULED_AT &&
      row.PERFORMED_AT.getTime() < row.SCHEDULED_AT.getTime()
    ) {
      throw new BadRequestError(
        'PERFORMED_AT no puede ser menor que SCHEDULED_AT.'
      )
    }
  }
}
