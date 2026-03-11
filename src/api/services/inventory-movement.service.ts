import { Article } from '@entity/Article'
import { InventoryMovement } from '@entity/InventoryMovement'
import { InventoryMovementDetail } from '@entity/InventoryMovementDetail'
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
import { In, Repository } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'

export const INVENTORY_MOVEMENT_TYPES = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  ADJUSTMENT_IN: 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT: 'ADJUSTMENT_OUT',
  WORK_ORDER_CONSUMPTION: 'WORK_ORDER_CONSUMPTION',
  WORK_ORDER_REVERSAL: 'WORK_ORDER_REVERSAL',
  INTERNAL_PURCHASE_RECEIPT: 'INTERNAL_PURCHASE_RECEIPT',
} as const

type InventoryMovementType =
  (typeof INVENTORY_MOVEMENT_TYPES)[keyof typeof INVENTORY_MOVEMENT_TYPES]

const MANUAL_MOVEMENT_TYPES: InventoryMovementType[] = [
  INVENTORY_MOVEMENT_TYPES.ENTRY,
  INVENTORY_MOVEMENT_TYPES.EXIT,
  INVENTORY_MOVEMENT_TYPES.ADJUSTMENT_IN,
  INVENTORY_MOVEMENT_TYPES.ADJUSTMENT_OUT,
]

type InventoryMovementDetailPayload = {
  ARTICLE_ID: number
  QUANTITY: number
  UNIT_COST_REFERENCE?: number | null
  NOTES?: string | null
}

type InventoryMovementPayload = {
  MOVEMENT_TYPE?: InventoryMovementType
  MOVEMENT_DATE?: Date | string | null
  REFERENCE_SOURCE?: string | null
  REFERENCE_ID?: number | null
  NOTES?: string | null
  DETAILS?: InventoryMovementDetailPayload[]
  STATE?: string
}

type InventoryMovementTypeResponse = {
  CODE: InventoryMovementType
  NAME: string
  IS_SYSTEM: boolean
}

type InventoryMovementDetailResponse = {
  MOVEMENT_DETAIL_ID: number
  ARTICLE_ID: number
  ARTICLE_CODE: string
  ARTICLE_NAME: string
  QUANTITY: number
  UNIT_COST_REFERENCE: number | null
  NOTES: string
}

export type InventoryMovementResponse = {
  MOVEMENT_ID: number
  MOVEMENT_NO: string
  MOVEMENT_TYPE: InventoryMovementType
  MOVEMENT_DATE: Date
  REFERENCE_SOURCE: string
  REFERENCE_ID: number | null
  NOTES: string
  STATE: string
  DETAILS?: InventoryMovementDetailResponse[]
  CREATED_AT?: Date | null
}

type InventoryMovementPaginationRow = {
  MOVEMENT_ID: number | string
  MOVEMENT_NO: string | null
  MOVEMENT_TYPE: InventoryMovementType
  MOVEMENT_DATE: Date
  REFERENCE_SOURCE: string | null
  REFERENCE_ID: number | string | null
  NOTES: string | null
  STATE: string | null
  CREATED_AT: Date | null
}

export class InventoryMovementService extends BaseService {
  private inventoryMovementRepository: Repository<InventoryMovement>
  private inventoryMovementDetailRepository: Repository<InventoryMovementDetail>
  private articleRepository: Repository<Article>

  constructor() {
    super()
    this.inventoryMovementRepository =
      this.datasource.getRepository(InventoryMovement)
    this.inventoryMovementDetailRepository =
      this.datasource.getRepository(InventoryMovementDetail)
    this.articleRepository = this.datasource.getRepository(Article)
  }

  @CatchServiceError()
  async create(
    payload: InventoryMovementPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<InventoryMovementResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const movementType = this.normalizeMovementType(payload.MOVEMENT_TYPE)

    if (!MANUAL_MOVEMENT_TYPES.includes(movementType)) {
      throw new BadRequestError(
        'Solo puede crear manualmente movimientos de entrada, salida o ajuste.'
      )
    }

    const normalizedPayload = this.normalizePayload(payload, movementType, false)
    let movementId = 0

    await this.datasource.transaction(async (manager) => {
      const saved = await this.registerMovementWithinTransaction(manager, {
        businessId,
        movementType,
        movementDate: normalizedPayload.MOVEMENT_DATE,
        referenceSource: 'MANUAL',
        referenceId: null,
        notes: normalizedPayload.NOTES,
        details: normalizedPayload.DETAILS,
        userId: sessionInfo.userId,
        state: payload.STATE || 'A',
      })

      movementId = saved.MOVEMENT_ID
    })

    return this.success({
      data: await this.buildMovementResponse(movementId, businessId),
    })
  }

  @CatchServiceError()
  async getOne(
    movementId: number
  ): Promise<ApiResponse<InventoryMovementResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    return this.success({
      data: await this.buildMovementResponse(movementId, businessId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<InventoryMovement>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<InventoryMovementResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedConditions = preparePaginationConditions(conditions, [
      'MOVEMENT_NO',
      'MOVEMENT_TYPE',
      'REFERENCE_SOURCE',
      'NOTES',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "MOVEMENT_ID",
        "MOVEMENT_NO",
        "MOVEMENT_TYPE",
        "MOVEMENT_DATE",
        "REFERENCE_SOURCE",
        "REFERENCE_ID",
        "NOTES",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "MOVEMENT_ID",
          "MOVEMENT_NO",
          "MOVEMENT_TYPE",
          "MOVEMENT_DATE",
          "REFERENCE_SOURCE",
          "REFERENCE_ID",
          "NOTES",
          "STATE",
          "CREATED_AT"
        FROM "INVENTORY_MOVEMENT"
        WHERE "BUSINESS_ID" = ${Number(businessId)}
      ) AS "inventory_movement_rows"
      ${whereClause}
      ORDER BY "MOVEMENT_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<InventoryMovementPaginationRow>({
      statement,
      values,
      pagination,
    })

    return this.success({
      data: data.map((item) => this.mapPaginatedMovementRow(item)),
      metadata,
    })
  }

  @CatchServiceError()
  async getMovementTypeList(): Promise<ApiResponse<InventoryMovementTypeResponse[]>> {
    const data: InventoryMovementTypeResponse[] = [
      {
        CODE: INVENTORY_MOVEMENT_TYPES.ENTRY,
        NAME: 'Entrada manual',
        IS_SYSTEM: false,
      },
      {
        CODE: INVENTORY_MOVEMENT_TYPES.EXIT,
        NAME: 'Salida manual',
        IS_SYSTEM: false,
      },
      {
        CODE: INVENTORY_MOVEMENT_TYPES.ADJUSTMENT_IN,
        NAME: 'Ajuste positivo',
        IS_SYSTEM: false,
      },
      {
        CODE: INVENTORY_MOVEMENT_TYPES.ADJUSTMENT_OUT,
        NAME: 'Ajuste negativo',
        IS_SYSTEM: false,
      },
      {
        CODE: INVENTORY_MOVEMENT_TYPES.WORK_ORDER_CONSUMPTION,
        NAME: 'Consumo por orden',
        IS_SYSTEM: true,
      },
      {
        CODE: INVENTORY_MOVEMENT_TYPES.WORK_ORDER_REVERSAL,
        NAME: 'Reversion por orden',
        IS_SYSTEM: true,
      },
      {
        CODE: INVENTORY_MOVEMENT_TYPES.INTERNAL_PURCHASE_RECEIPT,
        NAME: 'Recepcion de orden interna',
        IS_SYSTEM: true,
      },
    ]

    return this.success({ data })
  }

  async registerMovementWithinTransaction(
    manager: any,
    payload: {
      businessId: number
      movementType: InventoryMovementType
      movementDate?: Date | null
      referenceSource?: string | null
      referenceId?: number | null
      notes?: string | null
      details: InventoryMovementDetailPayload[]
      userId: number
      state?: string
    }
  ): Promise<InventoryMovement> {
    if (!payload.details.length) {
      throw new BadRequestError('El movimiento debe tener al menos un detalle.')
    }

    const articleRepo = manager.getRepository(Article)
    const movementRepo = manager.getRepository(InventoryMovement)
    const detailRepo = manager.getRepository(InventoryMovementDetail)

    const details = payload.details.map((detail) => ({
      ARTICLE_ID: Number(detail.ARTICLE_ID),
      QUANTITY: this.normalizePositiveNumber(detail.QUANTITY, 'QUANTITY'),
      UNIT_COST_REFERENCE:
        detail.UNIT_COST_REFERENCE === undefined ||
        detail.UNIT_COST_REFERENCE === null
          ? null
          : this.normalizeNonNegativeNumber(
              detail.UNIT_COST_REFERENCE,
              'UNIT_COST_REFERENCE'
            ),
      NOTES: this.normalizeNullableText(detail.NOTES),
    }))

    const articleIds = details.map((item) => item.ARTICLE_ID)
    const uniqueIds = new Set(articleIds)

    if (uniqueIds.size !== articleIds.length) {
      throw new BadRequestError(
        'No puede repetir articulos dentro del mismo movimiento.'
      )
    }

    const articles = await articleRepo.find({
      where: {
        ARTICLE_ID: In([...uniqueIds]),
        BUSINESS_ID: payload.businessId,
      },
    })

    if (articles.length !== uniqueIds.size) {
      throw new NotFoundError(
        'Uno o mas articulos del movimiento no fueron encontrados.'
      )
    }

    const direction = this.resolveDirection(payload.movementType)
    for (const article of articles) {
      const detail = details.find((item) => item.ARTICLE_ID === article.ARTICLE_ID)
      const quantity = Number(detail?.QUANTITY || 0)
      const currentStock = this.toNumber(article.CURRENT_STOCK)
      const nextStock = Number((currentStock + direction * quantity).toFixed(2))

      if (nextStock < 0) {
        throw new DbConflictError(
          `Stock insuficiente para el articulo '${article.CODE}'.`
        )
      }

      article.CURRENT_STOCK = nextStock
      article.UPDATED_BY = payload.userId
      await articleRepo.save(article)
    }

    const movement = movementRepo.create({
      BUSINESS_ID: payload.businessId,
      MOVEMENT_TYPE: payload.movementType,
      MOVEMENT_DATE: payload.movementDate || new Date(),
      REFERENCE_SOURCE: payload.referenceSource || 'MANUAL',
      REFERENCE_ID: payload.referenceId ?? null,
      NOTES: this.normalizeNullableText(payload.notes),
      STATE: payload.state || 'A',
      CREATED_BY: payload.userId,
    })

    const savedMovement = await movementRepo.save(movement)
    savedMovement.MOVEMENT_NO = this.buildMovementNo(savedMovement.MOVEMENT_ID)
    await movementRepo.save(savedMovement)

    await detailRepo.save(
      details.map((detail) =>
        detailRepo.create({
          MOVEMENT_ID: savedMovement.MOVEMENT_ID,
          ARTICLE_ID: detail.ARTICLE_ID,
          QUANTITY: detail.QUANTITY,
          UNIT_COST_REFERENCE: detail.UNIT_COST_REFERENCE,
          NOTES: detail.NOTES,
          CREATED_BY: payload.userId,
          STATE: 'A',
        })
      )
    )

    return savedMovement
  }

  private async buildMovementResponse(
    movementId: number,
    businessId: number
  ): Promise<InventoryMovementResponse> {
    const movement = await this.inventoryMovementRepository.findOne({
      where: { MOVEMENT_ID: movementId, BUSINESS_ID: businessId },
      relations: ['DETAILS', 'DETAILS.ARTICLE'],
    })

    if (!movement) {
      throw new NotFoundError(
        `Movimiento de inventario con id '${movementId}' no encontrado.`
      )
    }

    return {
      ...this.mapMovementSummary(movement),
      DETAILS: (movement.DETAILS || [])
        .sort((a, b) => a.MOVEMENT_DETAIL_ID - b.MOVEMENT_DETAIL_ID)
        .map((detail) => ({
          MOVEMENT_DETAIL_ID: detail.MOVEMENT_DETAIL_ID,
          ARTICLE_ID: detail.ARTICLE_ID,
          ARTICLE_CODE: detail.ARTICLE?.CODE || '',
          ARTICLE_NAME: detail.ARTICLE?.NAME || '',
          QUANTITY: this.toNumber(detail.QUANTITY),
          UNIT_COST_REFERENCE:
            detail.UNIT_COST_REFERENCE === null
              ? null
              : this.toNumber(detail.UNIT_COST_REFERENCE),
          NOTES: detail.NOTES || '',
        })),
    }
  }

  private mapMovementSummary(
    movement: InventoryMovement
  ): InventoryMovementResponse {
    return {
      MOVEMENT_ID: movement.MOVEMENT_ID,
      MOVEMENT_NO: movement.MOVEMENT_NO || '',
      MOVEMENT_TYPE: movement.MOVEMENT_TYPE as InventoryMovementType,
      MOVEMENT_DATE: movement.MOVEMENT_DATE,
      REFERENCE_SOURCE: movement.REFERENCE_SOURCE || '',
      REFERENCE_ID: movement.REFERENCE_ID ?? null,
      NOTES: movement.NOTES || '',
      STATE: movement.STATE || 'A',
      CREATED_AT: movement.CREATED_AT,
    }
  }

  private mapPaginatedMovementRow(
    movement: InventoryMovementPaginationRow
  ): InventoryMovementResponse {
    return {
      MOVEMENT_ID: Number(movement.MOVEMENT_ID),
      MOVEMENT_NO: movement.MOVEMENT_NO || '',
      MOVEMENT_TYPE: movement.MOVEMENT_TYPE,
      MOVEMENT_DATE: movement.MOVEMENT_DATE,
      REFERENCE_SOURCE: movement.REFERENCE_SOURCE || '',
      REFERENCE_ID:
        movement.REFERENCE_ID === null || movement.REFERENCE_ID === undefined
          ? null
          : Number(movement.REFERENCE_ID),
      NOTES: movement.NOTES || '',
      STATE: movement.STATE || 'A',
      CREATED_AT: movement.CREATED_AT || null,
    }
  }

  private normalizePayload(
    payload: InventoryMovementPayload,
    movementType: InventoryMovementType,
    allowSystemType: boolean
  ): {
    MOVEMENT_TYPE: InventoryMovementType
    MOVEMENT_DATE: Date | null
    NOTES: string | null
    DETAILS: InventoryMovementDetailPayload[]
  } {
    if (!allowSystemType && !MANUAL_MOVEMENT_TYPES.includes(movementType)) {
      throw new BadRequestError('Tipo de movimiento no permitido.')
    }

    const details = (payload.DETAILS || []).map((detail) => ({
      ARTICLE_ID: Number(detail.ARTICLE_ID),
      QUANTITY: this.normalizePositiveNumber(detail.QUANTITY, 'QUANTITY'),
      UNIT_COST_REFERENCE:
        detail.UNIT_COST_REFERENCE === undefined ||
        detail.UNIT_COST_REFERENCE === null
          ? null
          : this.normalizeNonNegativeNumber(
              detail.UNIT_COST_REFERENCE,
              'UNIT_COST_REFERENCE'
            ),
      NOTES: this.normalizeNullableText(detail.NOTES),
    }))

    if (!details.length) {
      throw new BadRequestError(
        'El movimiento debe contener al menos un articulo.'
      )
    }

    return {
      MOVEMENT_TYPE: movementType,
      MOVEMENT_DATE: this.normalizeDate(payload.MOVEMENT_DATE),
      NOTES: this.normalizeNullableText(payload.NOTES),
      DETAILS: details,
    }
  }

  private normalizeMovementType(value?: string): InventoryMovementType {
    const normalized = `${value || ''}`.trim().toUpperCase()

    if (!normalized) {
      throw new BadRequestError('El campo MOVEMENT_TYPE es requerido.')
    }

    const validTypes = Object.values(INVENTORY_MOVEMENT_TYPES)
    if (!validTypes.includes(normalized as InventoryMovementType)) {
      throw new BadRequestError('MOVEMENT_TYPE no es valido.')
    }

    return normalized as InventoryMovementType
  }

  private resolveDirection(type: InventoryMovementType): number {
    switch (type) {
      case INVENTORY_MOVEMENT_TYPES.ENTRY:
      case INVENTORY_MOVEMENT_TYPES.ADJUSTMENT_IN:
      case INVENTORY_MOVEMENT_TYPES.WORK_ORDER_REVERSAL:
      case INVENTORY_MOVEMENT_TYPES.INTERNAL_PURCHASE_RECEIPT:
        return 1
      default:
        return -1
    }
  }

  private buildMovementNo(movementId: number): string {
    return `MOV-${String(movementId).padStart(6, '0')}`
  }

  private normalizePositiveNumber(value: number | undefined, field: string): number {
    if (value === undefined || value === null) {
      throw new BadRequestError(`El campo ${field} es requerido.`)
    }

    const normalized = Number(value)
    if (!Number.isFinite(normalized) || normalized <= 0) {
      throw new BadRequestError(`El campo ${field} debe ser mayor que cero.`)
    }

    return Number(normalized.toFixed(2))
  }

  private normalizeNonNegativeNumber(
    value: number | undefined,
    field: string
  ): number {
    if (value === undefined || value === null) {
      throw new BadRequestError(`El campo ${field} es requerido.`)
    }

    const normalized = Number(value)
    if (!Number.isFinite(normalized) || normalized < 0) {
      throw new BadRequestError(`El campo ${field} debe ser mayor o igual a cero.`)
    }

    return Number(normalized.toFixed(2))
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = `${value || ''}`.trim()
    return normalized || null
  }

  private normalizeDate(value?: Date | string | null): Date | null {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('La fecha indicada no tiene un formato valido.')
    }

    return date
  }

  private toNumber(value: unknown): number {
    const normalized = Number(value)
    if (!Number.isFinite(normalized)) {
      return 0
    }
    return Number(normalized.toFixed(2))
  }
}
