import { Article } from '@entity/Article'
import { InternalPurchaseOrder } from '@entity/InternalPurchaseOrder'
import { InternalPurchaseOrderLine } from '@entity/InternalPurchaseOrderLine'
import {
  INVENTORY_MOVEMENT_TYPES,
  InventoryMovementService,
} from '@api/services/inventory-movement.service'
import {
  BadRequestError,
  NotFoundError,
} from '@api/errors/http.error'
import {
  ApiResponse,
  Pagination,
  AdvancedCondition,
  SessionInfo,
} from '@src/types/api.types'
import { paginatedQuery } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'
import { In, Repository } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'

export const INTERNAL_PURCHASE_ORDER_STATUSES = {
  GENERADA: 'GENERADA',
  ENVIADA: 'ENVIADA',
  RECIBIDA: 'RECIBIDA',
  CANCELADA: 'CANCELADA',
} as const

type InternalPurchaseOrderStatus =
  (typeof INTERNAL_PURCHASE_ORDER_STATUSES)[keyof typeof INTERNAL_PURCHASE_ORDER_STATUSES]

type InternalPurchaseOrderLinePayload = {
  ARTICLE_ID: number
  QUANTITY: number
  UNIT_COST_REFERENCE?: number | null
  NOTES?: string | null
}

type InternalPurchaseOrderPayload = {
  ORDER_DATE?: Date | string | null
  NOTES?: string | null
  ITEMS?: InternalPurchaseOrderLinePayload[]
  STATE?: string
}

type UpdateInternalPurchaseOrderStatusPayload = {
  INTERNAL_PURCHASE_ORDER_ID: number
  STATUS: InternalPurchaseOrderStatus
  ACTION_DATE?: Date | string | null
}

type InternalPurchaseOrderLineResponse = {
  INTERNAL_PURCHASE_ORDER_LINE_ID: number
  ARTICLE_ID: number
  ARTICLE_CODE: string
  ARTICLE_NAME: string
  QUANTITY: number
  UNIT_COST_REFERENCE: number | null
  NOTES: string
}

export type InternalPurchaseOrderResponse = {
  INTERNAL_PURCHASE_ORDER_ID: number
  ORDER_NO: string
  ORDER_DATE: Date
  STATUS: string
  SOURCE: string
  NOTES: string
  STATE: string
  ESTIMATED_TOTAL: number
  LINE_COUNT?: number
  ITEM_SUMMARY?: string
  SENT_AT?: Date | null
  RECEIVED_AT?: Date | null
  CANCELLED_AT?: Date | null
  RECEIVED_MOVEMENT_ID?: number | null
  RECEIVED_MOVEMENT_NO?: string | null
  LINES: InternalPurchaseOrderLineResponse[]
  CREATED_AT?: Date | null
}

type InternalPurchaseOrderPaginationRow = {
  INTERNAL_PURCHASE_ORDER_ID: number | string
  ORDER_NO: string | null
  ORDER_DATE: Date | string | null
  STATUS: string | null
  SOURCE: string | null
  NOTES: string | null
  STATE: string | null
  ESTIMATED_TOTAL: number | string | null
  LINE_COUNT: number | string | null
  ITEM_SUMMARY: string | null
  SENT_AT: Date | string | null
  RECEIVED_AT: Date | string | null
  CANCELLED_AT: Date | string | null
  RECEIVED_MOVEMENT_ID: number | string | null
  RECEIVED_MOVEMENT_NO: string | null
  CREATED_AT: Date | string | null
}

export class InternalPurchaseOrderService extends BaseService {
  private orderRepository: Repository<InternalPurchaseOrder>
  private articleRepository: Repository<Article>
  private inventoryMovementService: InventoryMovementService

  constructor() {
    super()
    this.orderRepository = this.datasource.getRepository(InternalPurchaseOrder)
    this.articleRepository = this.datasource.getRepository(Article)
    this.inventoryMovementService = new InventoryMovementService()
  }

  @CatchServiceError()
  async create(
    payload: InternalPurchaseOrderPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<InternalPurchaseOrderResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const items = this.normalizeItems(payload.ITEMS || [])
    const orderDate = this.normalizeDate(payload.ORDER_DATE)
    let orderId = 0

    await this.datasource.transaction(async (manager) => {
      const articleRepo = manager.getRepository(Article)
      const orderRepo = manager.getRepository(InternalPurchaseOrder)
      const lineRepo = manager.getRepository(InternalPurchaseOrderLine)

      const articleIds = items.map((item) => item.ARTICLE_ID)
      const uniqueIds = new Set(articleIds)

      if (uniqueIds.size !== articleIds.length) {
        throw new BadRequestError(
          'No puede repetir articulos dentro de la misma orden interna.'
        )
      }

      const articles = await articleRepo.find({
        where: {
          ARTICLE_ID: In([...uniqueIds]),
          BUSINESS_ID: businessId,
        },
      })

      if (articles.length !== uniqueIds.size) {
        throw new NotFoundError(
          'Uno o mas articulos de la orden interna no fueron encontrados.'
        )
      }

      const savedOrder = await orderRepo.save(
        orderRepo.create({
          BUSINESS_ID: businessId,
          ORDER_DATE: orderDate || new Date(),
          STATUS: INTERNAL_PURCHASE_ORDER_STATUSES.GENERADA,
          SOURCE: 'REPLENISHMENT',
          NOTES: this.normalizeNullableText(payload.NOTES),
          STATE: payload.STATE || 'A',
          CREATED_BY: sessionInfo.userId,
        })
      )

      savedOrder.ORDER_NO = this.buildOrderNo(savedOrder.INTERNAL_PURCHASE_ORDER_ID)
      await orderRepo.save(savedOrder)

      await lineRepo.save(
        items.map((item) =>
          lineRepo.create({
            INTERNAL_PURCHASE_ORDER_ID: savedOrder.INTERNAL_PURCHASE_ORDER_ID,
            ARTICLE_ID: item.ARTICLE_ID,
            QUANTITY: item.QUANTITY,
            UNIT_COST_REFERENCE: item.UNIT_COST_REFERENCE,
            NOTES: item.NOTES,
            STATE: 'A',
            CREATED_BY: sessionInfo.userId,
          })
        )
      )

      orderId = savedOrder.INTERNAL_PURCHASE_ORDER_ID
    })

    return this.success({
      data: await this.buildOrderResponse(orderId, businessId),
    })
  }

  @CatchServiceError()
  async getOne(
    orderId: number
  ): Promise<ApiResponse<InternalPurchaseOrderResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    return this.success({
      data: await this.buildOrderResponse(orderId, businessId),
    })
  }

  @CatchServiceError()
  async updateStatus(
    payload: UpdateInternalPurchaseOrderStatusPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<InternalPurchaseOrderResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const targetStatus = this.normalizeStatus(payload.STATUS)
    const actionDate = this.normalizeDate(payload.ACTION_DATE) || new Date()
    const orderId = Number(payload.INTERNAL_PURCHASE_ORDER_ID)

    await this.datasource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(InternalPurchaseOrder)
      const order = await orderRepo.findOne({
        where: {
          INTERNAL_PURCHASE_ORDER_ID: orderId,
          BUSINESS_ID: businessId,
        },
        relations: ['LINES'],
      })

      if (!order) {
        throw new NotFoundError(
          `Orden interna con id '${orderId}' no encontrada.`
        )
      }

      const currentStatus = this.normalizeStatus(order.STATUS)
      if (currentStatus === targetStatus) {
        throw new BadRequestError(
          'La orden interna ya se encuentra en el estado solicitado.'
        )
      }

      this.validateStatusTransition(currentStatus, targetStatus)

      if (targetStatus === INTERNAL_PURCHASE_ORDER_STATUSES.RECIBIDA) {
        if (order.RECEIVED_MOVEMENT_ID) {
          throw new BadRequestError(
            'La orden interna ya tiene una recepción registrada.'
          )
        }

        const movement = await this.inventoryMovementService.registerMovementWithinTransaction(
          manager,
          {
            businessId,
            movementType: INVENTORY_MOVEMENT_TYPES.INTERNAL_PURCHASE_RECEIPT,
            movementDate: actionDate,
            referenceSource: 'INTERNAL_PURCHASE_ORDER',
            referenceId: order.INTERNAL_PURCHASE_ORDER_ID,
            notes: this.buildReceiptMovementNotes(order),
            details: (order.LINES || []).map((line) => ({
              ARTICLE_ID: line.ARTICLE_ID,
              QUANTITY: this.toNumber(line.QUANTITY),
              UNIT_COST_REFERENCE:
                line.UNIT_COST_REFERENCE === null
                  ? null
                  : this.toNumber(line.UNIT_COST_REFERENCE),
              NOTES: line.NOTES || null,
            })),
            userId: sessionInfo.userId,
            state: 'A',
          }
        )

        order.RECEIVED_AT = movement.MOVEMENT_DATE
        order.RECEIVED_MOVEMENT_ID = movement.MOVEMENT_ID
        order.CANCELLED_AT = null
      }

      if (targetStatus === INTERNAL_PURCHASE_ORDER_STATUSES.ENVIADA) {
        order.SENT_AT = actionDate
        order.CANCELLED_AT = null
      }

      if (targetStatus === INTERNAL_PURCHASE_ORDER_STATUSES.GENERADA) {
        order.SENT_AT = null
        order.CANCELLED_AT = null
      }

      if (targetStatus === INTERNAL_PURCHASE_ORDER_STATUSES.CANCELADA) {
        order.CANCELLED_AT = actionDate
      }

      order.STATUS = targetStatus
      order.UPDATED_BY = sessionInfo.userId
      await orderRepo.save(order)
    })

    return this.success({
      data: await this.buildOrderResponse(orderId, businessId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<InternalPurchaseOrder>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<InternalPurchaseOrderResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedConditions = preparePaginationConditions(conditions, [
      'ORDER_NO',
      'STATUS',
      'SOURCE',
      'NOTES',
      'ITEM_SUMMARY',
      'RECEIVED_MOVEMENT_NO',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )

    const statement = `
      SELECT
        "INTERNAL_PURCHASE_ORDER_ID",
        "ORDER_NO",
        "ORDER_DATE",
        "STATUS",
        "SOURCE",
        "NOTES",
        "STATE",
        "ESTIMATED_TOTAL",
        "LINE_COUNT",
        "ITEM_SUMMARY",
        "SENT_AT",
        "RECEIVED_AT",
        "CANCELLED_AT",
        "RECEIVED_MOVEMENT_ID",
        "RECEIVED_MOVEMENT_NO",
        "CREATED_AT"
      FROM (
        SELECT
          "ipo"."INTERNAL_PURCHASE_ORDER_ID" AS "INTERNAL_PURCHASE_ORDER_ID",
          "ipo"."ORDER_NO" AS "ORDER_NO",
          "ipo"."ORDER_DATE" AS "ORDER_DATE",
          "ipo"."STATUS" AS "STATUS",
          "ipo"."SOURCE" AS "SOURCE",
          "ipo"."NOTES" AS "NOTES",
          "ipo"."STATE" AS "STATE",
          ROUND(
            COALESCE(
              SUM("line"."QUANTITY" * COALESCE("line"."UNIT_COST_REFERENCE", 0)),
              0
            )::numeric,
            2
          ) AS "ESTIMATED_TOTAL",
          COUNT("line"."INTERNAL_PURCHASE_ORDER_LINE_ID") AS "LINE_COUNT",
          STRING_AGG(
            TRIM(CONCAT(COALESCE("article"."CODE", ''), ' ', COALESCE("article"."NAME", ''))),
            ' | '
            ORDER BY "line"."INTERNAL_PURCHASE_ORDER_LINE_ID"
          ) AS "ITEM_SUMMARY",
          "ipo"."SENT_AT" AS "SENT_AT",
          "ipo"."RECEIVED_AT" AS "RECEIVED_AT",
          "ipo"."CANCELLED_AT" AS "CANCELLED_AT",
          "ipo"."RECEIVED_MOVEMENT_ID" AS "RECEIVED_MOVEMENT_ID",
          "movement"."MOVEMENT_NO" AS "RECEIVED_MOVEMENT_NO",
          "ipo"."CREATED_AT" AS "CREATED_AT"
        FROM "INTERNAL_PURCHASE_ORDER" "ipo"
        LEFT JOIN "INTERNAL_PURCHASE_ORDER_LINE" "line"
          ON "line"."INTERNAL_PURCHASE_ORDER_ID" = "ipo"."INTERNAL_PURCHASE_ORDER_ID"
        LEFT JOIN "ARTICLE" "article"
          ON "article"."ARTICLE_ID" = "line"."ARTICLE_ID"
        LEFT JOIN "INVENTORY_MOVEMENT" "movement"
          ON "movement"."MOVEMENT_ID" = "ipo"."RECEIVED_MOVEMENT_ID"
        WHERE "ipo"."BUSINESS_ID" = ${Number(businessId)}
        GROUP BY
          "ipo"."INTERNAL_PURCHASE_ORDER_ID",
          "ipo"."ORDER_NO",
          "ipo"."ORDER_DATE",
          "ipo"."STATUS",
          "ipo"."SOURCE",
          "ipo"."NOTES",
          "ipo"."STATE",
          "ipo"."SENT_AT",
          "ipo"."RECEIVED_AT",
          "ipo"."CANCELLED_AT",
          "ipo"."RECEIVED_MOVEMENT_ID",
          "movement"."MOVEMENT_NO",
          "ipo"."CREATED_AT"
      ) AS "internal_purchase_order_rows"
      ${whereClause}
      ORDER BY "INTERNAL_PURCHASE_ORDER_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<InternalPurchaseOrderPaginationRow>(
      {
        statement,
        values,
        pagination,
      }
    )

    return this.success({
      data: data.map((item) => this.mapPaginatedOrder(item)),
      metadata,
    })
  }

  private async buildOrderResponse(
    orderId: number,
    businessId: number
  ): Promise<InternalPurchaseOrderResponse> {
    const order = await this.orderRepository.findOne({
      where: {
        INTERNAL_PURCHASE_ORDER_ID: orderId,
        BUSINESS_ID: businessId,
      },
      relations: ['LINES', 'LINES.ARTICLE', 'RECEIVED_MOVEMENT'],
    })

    if (!order) {
      throw new NotFoundError(
        `Orden interna con id '${orderId}' no encontrada.`
      )
    }

    return {
      INTERNAL_PURCHASE_ORDER_ID: order.INTERNAL_PURCHASE_ORDER_ID,
      ORDER_NO: order.ORDER_NO || '',
      ORDER_DATE: order.ORDER_DATE,
      STATUS: order.STATUS || '',
      SOURCE: order.SOURCE || '',
      NOTES: order.NOTES || '',
      STATE: order.STATE || 'A',
      ESTIMATED_TOTAL: (order.LINES || []).reduce((acc, item) => {
        return (
          acc +
          this.toNumber(item.QUANTITY) * this.toNumber(item.UNIT_COST_REFERENCE)
        )
      }, 0),
      LINES: (order.LINES || [])
        .sort(
          (a, b) =>
            a.INTERNAL_PURCHASE_ORDER_LINE_ID - b.INTERNAL_PURCHASE_ORDER_LINE_ID
        )
        .map((item) => ({
          INTERNAL_PURCHASE_ORDER_LINE_ID: item.INTERNAL_PURCHASE_ORDER_LINE_ID,
          ARTICLE_ID: item.ARTICLE_ID,
          ARTICLE_CODE: item.ARTICLE?.CODE || '',
          ARTICLE_NAME: item.ARTICLE?.NAME || '',
          QUANTITY: this.toNumber(item.QUANTITY),
          UNIT_COST_REFERENCE:
            item.UNIT_COST_REFERENCE === null
              ? null
              : this.toNumber(item.UNIT_COST_REFERENCE),
          NOTES: item.NOTES || '',
        })),
      LINE_COUNT: order.LINES?.length || 0,
      ITEM_SUMMARY: (order.LINES || [])
        .map((item) =>
          `${item.ARTICLE?.CODE || ''} ${item.ARTICLE?.NAME || ''}`.trim()
        )
        .filter(Boolean)
        .join(' | '),
      SENT_AT: order.SENT_AT,
      RECEIVED_AT: order.RECEIVED_AT,
      CANCELLED_AT: order.CANCELLED_AT,
      RECEIVED_MOVEMENT_ID: order.RECEIVED_MOVEMENT_ID ?? null,
      RECEIVED_MOVEMENT_NO: order.RECEIVED_MOVEMENT?.MOVEMENT_NO || null,
      CREATED_AT: order.CREATED_AT,
    }
  }

  private mapPaginatedOrder(
    row: InternalPurchaseOrderPaginationRow
  ): InternalPurchaseOrderResponse {
    return {
      INTERNAL_PURCHASE_ORDER_ID: Number(row.INTERNAL_PURCHASE_ORDER_ID),
      ORDER_NO: row.ORDER_NO || '',
      ORDER_DATE: row.ORDER_DATE ? new Date(row.ORDER_DATE) : new Date(),
      STATUS: row.STATUS || '',
      SOURCE: row.SOURCE || '',
      NOTES: row.NOTES || '',
      STATE: row.STATE || 'A',
      ESTIMATED_TOTAL: this.toNumber(row.ESTIMATED_TOTAL),
      LINE_COUNT: Number(row.LINE_COUNT || 0),
      ITEM_SUMMARY: row.ITEM_SUMMARY || '',
      SENT_AT: row.SENT_AT ? new Date(row.SENT_AT) : null,
      RECEIVED_AT: row.RECEIVED_AT ? new Date(row.RECEIVED_AT) : null,
      CANCELLED_AT: row.CANCELLED_AT ? new Date(row.CANCELLED_AT) : null,
      RECEIVED_MOVEMENT_ID:
        row.RECEIVED_MOVEMENT_ID === null ||
        row.RECEIVED_MOVEMENT_ID === undefined
          ? null
          : Number(row.RECEIVED_MOVEMENT_ID),
      RECEIVED_MOVEMENT_NO: row.RECEIVED_MOVEMENT_NO || null,
      LINES: [],
      CREATED_AT: row.CREATED_AT ? new Date(row.CREATED_AT) : null,
    }
  }

  private validateStatusTransition(
    currentStatus: InternalPurchaseOrderStatus,
    targetStatus: InternalPurchaseOrderStatus
  ): void {
    const allowedTransitions: Record<
      InternalPurchaseOrderStatus,
      InternalPurchaseOrderStatus[]
    > = {
      [INTERNAL_PURCHASE_ORDER_STATUSES.GENERADA]: [
        INTERNAL_PURCHASE_ORDER_STATUSES.ENVIADA,
        INTERNAL_PURCHASE_ORDER_STATUSES.RECIBIDA,
        INTERNAL_PURCHASE_ORDER_STATUSES.CANCELADA,
      ],
      [INTERNAL_PURCHASE_ORDER_STATUSES.ENVIADA]: [
        INTERNAL_PURCHASE_ORDER_STATUSES.GENERADA,
        INTERNAL_PURCHASE_ORDER_STATUSES.RECIBIDA,
        INTERNAL_PURCHASE_ORDER_STATUSES.CANCELADA,
      ],
      [INTERNAL_PURCHASE_ORDER_STATUSES.RECIBIDA]: [],
      [INTERNAL_PURCHASE_ORDER_STATUSES.CANCELADA]: [],
    }

    if (!allowedTransitions[currentStatus].includes(targetStatus)) {
      throw new BadRequestError(
        `No se puede cambiar la orden interna de ${currentStatus} a ${targetStatus}.`
      )
    }
  }

  private normalizeStatus(value?: string | null): InternalPurchaseOrderStatus {
    const normalized = `${value || ''}`.trim().toUpperCase()
    const validValues = Object.values(INTERNAL_PURCHASE_ORDER_STATUSES)

    if (!validValues.includes(normalized as InternalPurchaseOrderStatus)) {
      throw new BadRequestError('STATUS no es valido.')
    }

    return normalized as InternalPurchaseOrderStatus
  }

  private buildReceiptMovementNotes(order: InternalPurchaseOrder): string {
    return `Recepcion generada desde la orden interna ${
      order.ORDER_NO || this.buildOrderNo(order.INTERNAL_PURCHASE_ORDER_ID)
    }.`
  }

  private normalizeItems(items: InternalPurchaseOrderLinePayload[]) {
    if (!items.length) {
      throw new BadRequestError(
        'La orden interna debe incluir al menos un articulo.'
      )
    }

    return items.map((item, index) => ({
      ARTICLE_ID: Number(item.ARTICLE_ID),
      QUANTITY: this.normalizePositiveNumber(
        item.QUANTITY,
        `ITEMS[${index}].QUANTITY`
      ),
      UNIT_COST_REFERENCE:
        item.UNIT_COST_REFERENCE === undefined ||
        item.UNIT_COST_REFERENCE === null
          ? null
          : this.normalizeNonNegativeNumber(
              item.UNIT_COST_REFERENCE,
              `ITEMS[${index}].UNIT_COST_REFERENCE`
            ),
      NOTES: this.normalizeNullableText(item.NOTES),
    }))
  }

  private normalizePositiveNumber(value: unknown, fieldName = 'CAMPO'): number {
    const normalized = Number(value)

    if (!Number.isFinite(normalized) || normalized <= 0) {
      throw new BadRequestError(
        `El campo ${fieldName} debe ser un número mayor que cero.`
      )
    }

    return Number(normalized.toFixed(2))
  }

  private normalizeNonNegativeNumber(
    value: unknown,
    fieldName = 'CAMPO'
  ): number {
    const normalized = Number(value)

    if (!Number.isFinite(normalized) || normalized < 0) {
      throw new BadRequestError(
        `El campo ${fieldName} debe ser un número mayor o igual a cero.`
      )
    }

    return Number(normalized.toFixed(2))
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim()
    return normalized ? normalized : null
  }

  private normalizeDate(value?: string | Date | null): Date | null {
    if (!value) return null

    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('La fecha de la orden interna no es válida.')
    }

    return date
  }

  private buildOrderNo(orderId: number): string {
    return `OCI-${String(orderId).padStart(6, '0')}`
  }

  private toNumber(value: unknown): number {
    const normalized = Number(value || 0)
    return Number.isNaN(normalized) ? 0 : normalized
  }
}
