import { WorkOrderServiceType } from '@entity/WorkOrderServiceType'
import {
  BadRequestError,
  DbConflictError,
  NotFoundError,
} from '@api/errors/http.error'
import { paginatedQuery } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import { Repository } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'

type WorkOrderServiceTypePayload = {
  SERVICE_TYPE_ID?: number
  CODE?: string
  NAME?: string
  DESCRIPTION?: string | null
  ORDER_INDEX?: number
  STATE?: string
}

export type WorkOrderServiceTypeResponse = {
  SERVICE_TYPE_ID: number
  CODE: string
  NAME: string
  DESCRIPTION: string
  ORDER_INDEX: number
  STATE: string
  SCOPE: 'BASE' | 'EMPRESA'
  CREATED_AT?: Date | null
}

type WorkOrderServiceTypePaginationRow = {
  SERVICE_TYPE_ID: number | string
  CODE: string | null
  NAME: string | null
  DESCRIPTION: string | null
  ORDER_INDEX: number | string | null
  STATE: string | null
  SCOPE: 'BASE' | 'EMPRESA'
  CREATED_AT: Date | null
}

export class WorkOrderServiceTypeService extends BaseService {
  private serviceTypeRepository: Repository<WorkOrderServiceType>

  constructor() {
    super()
    this.serviceTypeRepository = this.datasource.getRepository(WorkOrderServiceType)
  }

  @CatchServiceError()
  async create(
    payload: WorkOrderServiceTypePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkOrderServiceTypeResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const code = this.normalizeCode(payload.CODE, true)

    await this.assertUniqueCode(businessId, code)

    const row = this.serviceTypeRepository.create({
      BUSINESS_ID: businessId,
      CODE: code,
      NAME: this.normalizeRequiredText(payload.NAME, 'NAME'),
      DESCRIPTION: this.normalizeNullableText(payload.DESCRIPTION),
      ORDER_INDEX: this.normalizeOrderIndex(payload.ORDER_INDEX),
      STATE: payload.STATE || 'A',
      CREATED_BY: sessionInfo.userId,
    })

    const saved = await this.serviceTypeRepository.save(row)

    return this.success({
      data: await this.buildResponse(saved.SERVICE_TYPE_ID, businessId),
    })
  }

  @CatchServiceError()
  async update(
    payload: WorkOrderServiceTypePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkOrderServiceTypeResponse>> {
    const serviceTypeId = Number(payload.SERVICE_TYPE_ID)

    if (!serviceTypeId) {
      throw new BadRequestError('El campo SERVICE_TYPE_ID es requerido.')
    }

    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const row = await this.findRow(serviceTypeId, businessId)

    if (payload.CODE !== undefined) {
      const code = this.normalizeCode(payload.CODE, true)
      await this.assertUniqueCode(businessId, code, serviceTypeId)
      row.CODE = code
    }
    if (payload.NAME !== undefined) {
      row.NAME = this.normalizeRequiredText(payload.NAME, 'NAME')
    }
    if (payload.DESCRIPTION !== undefined) {
      row.DESCRIPTION = this.normalizeNullableText(payload.DESCRIPTION)
    }
    if (payload.ORDER_INDEX !== undefined) {
      row.ORDER_INDEX = this.normalizeOrderIndex(payload.ORDER_INDEX)
    }
    if (payload.STATE !== undefined) {
      row.STATE = payload.STATE
    }

    row.UPDATED_BY = sessionInfo.userId
    await this.serviceTypeRepository.save(row)

    return this.success({
      data: await this.buildResponse(row.SERVICE_TYPE_ID, businessId),
    })
  }

  @CatchServiceError()
  async getOne(
    serviceTypeId: number
  ): Promise<ApiResponse<WorkOrderServiceTypeResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    return this.success({
      data: await this.buildResponse(serviceTypeId, businessId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<WorkOrderServiceType>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<WorkOrderServiceTypeResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedConditions = preparePaginationConditions(conditions, [
      'CODE',
      'NAME',
      'DESCRIPTION',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "SERVICE_TYPE_ID",
        "CODE",
        "NAME",
        "DESCRIPTION",
        "ORDER_INDEX",
        "STATE",
        "SCOPE",
        "CREATED_AT"
      FROM (
        SELECT
          "SERVICE_TYPE_ID",
          "CODE",
          "NAME",
          "DESCRIPTION",
          "ORDER_INDEX",
          "STATE",
          CASE
            WHEN "BUSINESS_ID" IS NULL THEN 'BASE'
            ELSE 'EMPRESA'
          END AS "SCOPE",
          "CREATED_AT"
        FROM "WORK_ORDER_SERVICE_TYPE"
        WHERE "BUSINESS_ID" IS NULL
          OR "BUSINESS_ID" = ${Number(businessId)}
      ) AS "work_order_service_type_rows"
      ${whereClause}
      ORDER BY "ORDER_INDEX" ASC, "SERVICE_TYPE_ID" ASC
    `

    const [data, metadata] = await paginatedQuery<WorkOrderServiceTypePaginationRow>({
      statement,
      values,
      pagination,
    })

    return this.success({
      data: data.map((item) => this.mapPaginatedRow(item)),
      metadata,
    })
  }

  @CatchServiceError()
  async getList(): Promise<ApiResponse<WorkOrderServiceTypeResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const rows = await this.serviceTypeRepository.find({
      where: [
        { BUSINESS_ID: null, STATE: 'A' },
        { BUSINESS_ID: businessId, STATE: 'A' },
      ],
      order: { ORDER_INDEX: 'ASC', SERVICE_TYPE_ID: 'ASC' },
    })

    return this.success({ data: rows.map((item) => this.mapRow(item)) })
  }

  private async buildResponse(
    serviceTypeId: number,
    businessId: number
  ): Promise<WorkOrderServiceTypeResponse> {
    const row = await this.findRow(serviceTypeId, businessId)
    return this.mapRow(row)
  }

  private async findRow(
    serviceTypeId: number,
    businessId: number
  ): Promise<WorkOrderServiceType> {
    const row = await this.serviceTypeRepository.findOne({
      where: [
        { SERVICE_TYPE_ID: serviceTypeId, BUSINESS_ID: null },
        { SERVICE_TYPE_ID: serviceTypeId, BUSINESS_ID: businessId },
      ],
    })

    if (!row) {
      throw new NotFoundError(
        `Tipo de servicio con id '${serviceTypeId}' no encontrado.`
      )
    }

    return row
  }

  private mapRow(row: WorkOrderServiceType): WorkOrderServiceTypeResponse {
    return {
      SERVICE_TYPE_ID: row.SERVICE_TYPE_ID,
      CODE: row.CODE || '',
      NAME: row.NAME || '',
      DESCRIPTION: row.DESCRIPTION || '',
      ORDER_INDEX: row.ORDER_INDEX || 0,
      STATE: row.STATE || 'A',
      SCOPE: row.BUSINESS_ID ? 'EMPRESA' : 'BASE',
      CREATED_AT: row.CREATED_AT,
    }
  }

  private mapPaginatedRow(
    row: WorkOrderServiceTypePaginationRow
  ): WorkOrderServiceTypeResponse {
    return {
      SERVICE_TYPE_ID: Number(row.SERVICE_TYPE_ID),
      CODE: row.CODE || '',
      NAME: row.NAME || '',
      DESCRIPTION: row.DESCRIPTION || '',
      ORDER_INDEX:
        row.ORDER_INDEX === null || row.ORDER_INDEX === undefined
          ? 0
          : Number(row.ORDER_INDEX),
      STATE: row.STATE || 'A',
      SCOPE: row.SCOPE,
      CREATED_AT: row.CREATED_AT || null,
    }
  }

  private normalizeCode(value?: string, required = false): string {
    const normalized = value?.trim().toUpperCase() || ''
    if (required && !normalized) {
      throw new BadRequestError('El campo CODE es requerido.')
    }
    return normalized
  }

  private normalizeRequiredText(value?: string, fieldName = 'CAMPO'): string {
    const normalized = value?.trim() || ''
    if (!normalized) {
      throw new BadRequestError(`El campo ${fieldName} es requerido.`)
    }
    return normalized
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim() || ''
    return normalized || null
  }

  private normalizeOrderIndex(value?: number): number {
    if (value === undefined || value === null) return 0
    const normalized = Number(value)
    if (!Number.isInteger(normalized) || normalized < 0) {
      throw new BadRequestError('ORDER_INDEX debe ser un entero positivo.')
    }
    return normalized
  }

  private async assertUniqueCode(
    businessId: number,
    code: string,
    currentId?: number
  ) {
    const qb = this.serviceTypeRepository
      .createQueryBuilder('t')
      .where('UPPER(t.CODE) = UPPER(:code)', { code })
      .andWhere('(t.BUSINESS_ID IS NULL OR t.BUSINESS_ID = :businessId)', {
        businessId,
      })

    if (currentId) {
      qb.andWhere('t.SERVICE_TYPE_ID != :currentId', { currentId })
    }

    const row = await qb.getOne()
    if (row) {
      throw new DbConflictError(`El codigo '${code}' ya se encuentra en uso.`)
    }
  }

}
