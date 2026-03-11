import { WorkOrderStatus } from '@entity/WorkOrderStatus'
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

type WorkOrderStatusPayload = {
  STATUS_ID?: number
  CODE?: string
  NAME?: string
  DESCRIPTION?: string | null
  IS_FINAL?: boolean
  ORDER_INDEX?: number
  STATE?: string
}

export type WorkOrderStatusCatalogResponse = {
  STATUS_ID: number
  CODE: string
  NAME: string
  DESCRIPTION: string
  IS_FINAL: boolean
  ORDER_INDEX: number
  STATE: string
  SCOPE: 'BASE' | 'EMPRESA'
  CREATED_AT?: Date | null
}

type WorkOrderStatusPaginationRow = {
  STATUS_ID: number | string
  CODE: string | null
  NAME: string | null
  DESCRIPTION: string | null
  IS_FINAL: boolean | string | null
  ORDER_INDEX: number | string | null
  STATE: string | null
  SCOPE: 'BASE' | 'EMPRESA'
  CREATED_AT: Date | null
}

const PROTECTED_STATUS_RULES: Record<string, { isFinal: boolean }> = {
  CREADA: { isFinal: false },
  DIAGNOSTICO: { isFinal: false },
  REPARACION: { isFinal: false },
  LISTA_ENTREGA: { isFinal: false },
  ENTREGADA: { isFinal: true },
  CANCELADA: { isFinal: true },
}

export class WorkOrderStatusCatalogService extends BaseService {
  private statusRepository: Repository<WorkOrderStatus>

  constructor() {
    super()
    this.statusRepository = this.datasource.getRepository(WorkOrderStatus)
  }

  @CatchServiceError()
  async create(
    payload: WorkOrderStatusPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkOrderStatusCatalogResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const code = this.normalizeCode(payload.CODE, true)

    if (PROTECTED_STATUS_RULES[code]) {
      throw new BadRequestError(
        'Los codigos reservados del sistema no pueden crearse nuevamente.'
      )
    }

    await this.assertUniqueCode(code)

    const status = this.statusRepository.create({
      BUSINESS_ID: businessId,
      CODE: code,
      NAME: this.normalizeRequiredText(payload.NAME, 'NAME'),
      DESCRIPTION: this.normalizeNullableText(payload.DESCRIPTION),
      IS_FINAL: Boolean(payload.IS_FINAL),
      ORDER_INDEX: this.normalizeOrderIndex(payload.ORDER_INDEX),
      STATE: payload.STATE || 'A',
      CREATED_BY: sessionInfo.userId,
    })

    const saved = await this.statusRepository.save(status)

    return this.success({
      data: await this.buildResponse(saved.STATUS_ID, businessId),
    })
  }

  @CatchServiceError()
  async update(
    payload: WorkOrderStatusPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkOrderStatusCatalogResponse>> {
    const statusId = Number(payload.STATUS_ID)

    if (!statusId) {
      throw new BadRequestError('El campo STATUS_ID es requerido.')
    }

    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const status = await this.findStatus(statusId, businessId)
    const protectedRule = PROTECTED_STATUS_RULES[status.CODE]

    if (payload.CODE !== undefined) {
      const nextCode = this.normalizeCode(payload.CODE, true)
      if (protectedRule && nextCode !== status.CODE) {
        throw new BadRequestError(
          'No puede cambiar el codigo de un estado protegido del sistema.'
        )
      }

      if (nextCode !== status.CODE) {
        await this.assertUniqueCode(nextCode, statusId)
        status.CODE = nextCode
      }
    }

    if (payload.NAME !== undefined) {
      status.NAME = this.normalizeRequiredText(payload.NAME, 'NAME')
    }
    if (payload.DESCRIPTION !== undefined) {
      status.DESCRIPTION = this.normalizeNullableText(payload.DESCRIPTION)
    }
    if (payload.ORDER_INDEX !== undefined) {
      status.ORDER_INDEX = this.normalizeOrderIndex(payload.ORDER_INDEX)
    }
    if (payload.STATE !== undefined) {
      if (protectedRule && payload.STATE === 'I') {
        throw new BadRequestError(
          'No puede inactivar un estado protegido del sistema.'
        )
      }
      status.STATE = payload.STATE
    }
    if (payload.IS_FINAL !== undefined) {
      if (protectedRule && payload.IS_FINAL !== protectedRule.isFinal) {
        throw new BadRequestError(
          'No puede alterar la condicion final de un estado protegido del sistema.'
        )
      }
      status.IS_FINAL = Boolean(payload.IS_FINAL)
    }

    status.UPDATED_BY = sessionInfo.userId
    await this.statusRepository.save(status)

    return this.success({
      data: await this.buildResponse(status.STATUS_ID, businessId),
    })
  }

  @CatchServiceError()
  async getOne(
    statusId: number
  ): Promise<ApiResponse<WorkOrderStatusCatalogResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    return this.success({
      data: await this.buildResponse(statusId, businessId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<WorkOrderStatus>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<WorkOrderStatusCatalogResponse[]>> {
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
        "STATUS_ID",
        "CODE",
        "NAME",
        "DESCRIPTION",
        "IS_FINAL",
        "ORDER_INDEX",
        "STATE",
        "SCOPE",
        "CREATED_AT"
      FROM (
        SELECT
          "STATUS_ID",
          "CODE",
          "NAME",
          "DESCRIPTION",
          "IS_FINAL",
          "ORDER_INDEX",
          "STATE",
          CASE
            WHEN "BUSINESS_ID" IS NULL THEN 'BASE'
            ELSE 'EMPRESA'
          END AS "SCOPE",
          "CREATED_AT"
        FROM "WORK_ORDER_STATUS"
        WHERE "BUSINESS_ID" IS NULL
          OR "BUSINESS_ID" = ${Number(businessId)}
      ) AS "work_order_status_rows"
      ${whereClause}
      ORDER BY "ORDER_INDEX" ASC, "STATUS_ID" ASC
    `

    const [data, metadata] = await paginatedQuery<WorkOrderStatusPaginationRow>({
      statement,
      values,
      pagination,
    })

    return this.success({
      data: data.map((item) => this.mapPaginatedStatusRow(item)),
      metadata,
    })
  }

  private async buildResponse(
    statusId: number,
    businessId: number
  ): Promise<WorkOrderStatusCatalogResponse> {
    const status = await this.findStatus(statusId, businessId)
    return this.mapStatus(status)
  }

  private async findStatus(
    statusId: number,
    businessId: number
  ): Promise<WorkOrderStatus> {
    const status = await this.statusRepository.findOne({
      where: [
        { STATUS_ID: statusId, BUSINESS_ID: null },
        { STATUS_ID: statusId, BUSINESS_ID: businessId },
      ],
    })

    if (!status) {
      throw new NotFoundError(`Estado OT con id '${statusId}' no encontrado.`)
    }

    return status
  }

  private mapStatus(status: WorkOrderStatus): WorkOrderStatusCatalogResponse {
    return {
      STATUS_ID: status.STATUS_ID,
      CODE: status.CODE || '',
      NAME: status.NAME || '',
      DESCRIPTION: status.DESCRIPTION || '',
      IS_FINAL: Boolean(status.IS_FINAL),
      ORDER_INDEX: status.ORDER_INDEX || 0,
      STATE: status.STATE || 'A',
      SCOPE: status.BUSINESS_ID ? 'EMPRESA' : 'BASE',
      CREATED_AT: status.CREATED_AT,
    }
  }

  private mapPaginatedStatusRow(
    status: WorkOrderStatusPaginationRow
  ): WorkOrderStatusCatalogResponse {
    return {
      STATUS_ID: Number(status.STATUS_ID),
      CODE: status.CODE || '',
      NAME: status.NAME || '',
      DESCRIPTION: status.DESCRIPTION || '',
      IS_FINAL:
        status.IS_FINAL === true ||
        status.IS_FINAL === 'true' ||
        status.IS_FINAL === 'TRUE',
      ORDER_INDEX:
        status.ORDER_INDEX === null || status.ORDER_INDEX === undefined
          ? 0
          : Number(status.ORDER_INDEX),
      STATE: status.STATE || 'A',
      SCOPE: status.SCOPE,
      CREATED_AT: status.CREATED_AT || null,
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

  private async assertUniqueCode(code: string, currentStatusId?: number) {
    const exists = await this.statusRepository.findOne({ where: { CODE: code } })
    if (exists && exists.STATUS_ID !== currentStatusId) {
      throw new DbConflictError(`El codigo '${code}' ya se encuentra en uso.`)
    }
  }

}
