import { DeliveryReceipt } from '@entity/DeliveryReceipt'
import { WorkOrder } from '@entity/WorkOrder'
import { WorkOrderStatus } from '@entity/WorkOrderStatus'
import { WorkOrderStatusHistory } from '@entity/WorkOrderStatusHistory'
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
import { Person } from '@entity/Person'
import { Staff } from '@entity/Staff'
import { Vehicle } from '@entity/Vehicle'

type DeliveryReceiptPayload = {
  DELIVERY_RECEIPT_ID?: number
  WORK_ORDER_ID?: number
  DELIVERY_DATE?: Date | string | null
  RECEIVED_BY_NAME?: string
  RECEIVED_BY_DOCUMENT?: string | null
  RECEIVED_BY_PHONE?: string | null
  OBSERVATIONS?: string | null
  STATE?: string
}

export type DeliveryReceiptResponse = {
  DELIVERY_RECEIPT_ID: number
  RECEIPT_NO: string
  WORK_ORDER_ID: number
  WORK_ORDER_NO: string
  CUSTOMER_NAME: string
  VEHICLE_LABEL: string
  DELIVERED_BY_STAFF_ID: number
  DELIVERED_BY_NAME: string
  DELIVERY_DATE: Date
  RECEIVED_BY_NAME: string
  RECEIVED_BY_DOCUMENT: string
  RECEIVED_BY_PHONE: string
  OBSERVATIONS: string
  STATE: string
  CREATED_AT?: Date | null
}

type DeliveryReceiptPaginationRow = {
  DELIVERY_RECEIPT_ID: number | string
  RECEIPT_NO: string | null
  WORK_ORDER_ID: number | string
  WORK_ORDER_NO: string | null
  CUSTOMER_NAME: string | null
  VEHICLE_LABEL: string | null
  DELIVERED_BY_STAFF_ID: number | string
  DELIVERED_BY_NAME: string | null
  DELIVERY_DATE: Date
  RECEIVED_BY_NAME: string | null
  RECEIVED_BY_DOCUMENT: string | null
  RECEIVED_BY_PHONE: string | null
  OBSERVATIONS: string | null
  STATE: string | null
  CREATED_AT: Date | null
}

export class DeliveryReceiptService extends BaseService {
  private deliveryReceiptRepository: Repository<DeliveryReceipt>
  private workOrderRepository: Repository<WorkOrder>
  private workOrderStatusRepository: Repository<WorkOrderStatus>

  constructor() {
    super()
    this.deliveryReceiptRepository = this.datasource.getRepository(DeliveryReceipt)
    this.workOrderRepository = this.datasource.getRepository(WorkOrder)
    this.workOrderStatusRepository = this.datasource.getRepository(WorkOrderStatus)
  }

  @CatchServiceError()
  async create(
    payload: DeliveryReceiptPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<DeliveryReceiptResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const workOrderId = Number(payload.WORK_ORDER_ID)

    if (!workOrderId) {
      throw new BadRequestError('El campo WORK_ORDER_ID es requerido.')
    }

    const receivedByName = this.normalizeRequiredText(
      payload.RECEIVED_BY_NAME,
      'RECEIVED_BY_NAME'
    )
    const deliveryDate = this.normalizeDate(payload.DELIVERY_DATE) || new Date()

    let receiptId = 0

    await this.datasource.transaction(async (manager) => {
      const workOrderRepo = manager.getRepository(WorkOrder)
      const receiptRepo = manager.getRepository(DeliveryReceipt)

      const workOrder = await workOrderRepo.findOne({
        where: { WORK_ORDER_ID: workOrderId, BUSINESS_ID: businessId },
        relations: ['STATUS'],
      })

      if (!workOrder) {
        throw new NotFoundError(
          `Orden de trabajo con id '${workOrderId}' no encontrada.`
        )
      }

      if (workOrder.STATUS?.CODE === 'CANCELADA') {
        throw new BadRequestError(
          'No puede generar una entrega para una orden cancelada.'
        )
      }

      if (workOrder.STATUS?.CODE === 'ENTREGADA') {
        throw new BadRequestError(
          'La orden ya fue entregada y no admite otro comprobante.'
        )
      }

      if (workOrder.STATUS?.CODE !== 'LISTA_ENTREGA') {
        throw new BadRequestError(
          'La orden debe estar en estado Lista para entrega antes de emitir el comprobante.'
        )
      }

      const existingReceipt = await receiptRepo.findOne({
        where: { WORK_ORDER_ID: workOrderId, BUSINESS_ID: businessId },
      })

      if (existingReceipt) {
        throw new DbConflictError(
          'La orden ya posee un comprobante interno de entrega.'
        )
      }

      const deliveredStatus = await this.resolveDeliveredStatus(manager, businessId)

      const receipt = receiptRepo.create({
        BUSINESS_ID: businessId,
        WORK_ORDER_ID: workOrderId,
        DELIVERED_BY_STAFF_ID: sessionInfo.userId,
        DELIVERY_DATE: deliveryDate,
        RECEIVED_BY_NAME: receivedByName,
        RECEIVED_BY_DOCUMENT: this.normalizeNullableText(
          payload.RECEIVED_BY_DOCUMENT
        ),
        RECEIVED_BY_PHONE: this.normalizeNullableText(payload.RECEIVED_BY_PHONE),
        OBSERVATIONS: this.normalizeNullableText(payload.OBSERVATIONS),
        STATE: payload.STATE || 'A',
        CREATED_BY: sessionInfo.userId,
      })

      const savedReceipt = await receiptRepo.save(receipt)
      savedReceipt.RECEIPT_NO = this.buildReceiptNo(savedReceipt.DELIVERY_RECEIPT_ID)
      await receiptRepo.save(savedReceipt)
      receiptId = savedReceipt.DELIVERY_RECEIPT_ID

      workOrder.STATUS_ID = deliveredStatus.STATUS_ID
      workOrder.CLOSED_AT = deliveryDate
      workOrder.DELIVERED_BY_STAFF_ID = sessionInfo.userId
      workOrder.UPDATED_BY = sessionInfo.userId
      await workOrderRepo.save(workOrder)

      await manager.getRepository(WorkOrderStatusHistory).save(
        manager.getRepository(WorkOrderStatusHistory).create({
          WORK_ORDER_ID: workOrderId,
          STATUS_ID: deliveredStatus.STATUS_ID,
          CHANGED_BY_STAFF_ID: sessionInfo.userId,
          CHANGED_AT: deliveryDate,
          NOTES: `Comprobante interno ${savedReceipt.RECEIPT_NO}`,
        })
      )
    })

    return this.success({
      data: await this.buildResponse(receiptId, businessId),
    })
  }

  @CatchServiceError()
  async getOne(
    receiptId: number
  ): Promise<ApiResponse<DeliveryReceiptResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    return this.success({
      data: await this.buildResponse(receiptId, businessId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<DeliveryReceipt>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<DeliveryReceiptResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedConditions = preparePaginationConditions(conditions, [
      'RECEIPT_NO',
      'WORK_ORDER_NO',
      'CUSTOMER_NAME',
      'VEHICLE_LABEL',
      'RECEIVED_BY_NAME',
      'RECEIVED_BY_DOCUMENT',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "DELIVERY_RECEIPT_ID",
        "RECEIPT_NO",
        "WORK_ORDER_ID",
        "WORK_ORDER_NO",
        "CUSTOMER_NAME",
        "VEHICLE_LABEL",
        "DELIVERED_BY_STAFF_ID",
        "DELIVERED_BY_NAME",
        "DELIVERY_DATE",
        "RECEIVED_BY_NAME",
        "RECEIVED_BY_DOCUMENT",
        "RECEIVED_BY_PHONE",
        "OBSERVATIONS",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "dr"."DELIVERY_RECEIPT_ID" AS "DELIVERY_RECEIPT_ID",
          "dr"."RECEIPT_NO" AS "RECEIPT_NO",
          "dr"."WORK_ORDER_ID" AS "WORK_ORDER_ID",
          "wo"."ORDER_NO" AS "WORK_ORDER_NO",
          TRIM(CONCAT(COALESCE("c"."NAME", ''), ' ', COALESCE("c"."LAST_NAME", ''))) AS "CUSTOMER_NAME",
          TRIM(CONCAT(COALESCE("v"."PLATE", ''), ' ', COALESCE("v"."BRAND", ''), ' ', COALESCE("v"."MODEL", ''))) AS "VEHICLE_LABEL",
          "dr"."DELIVERED_BY_STAFF_ID" AS "DELIVERED_BY_STAFF_ID",
          TRIM(CONCAT(COALESCE("sp"."NAME", ''), ' ', COALESCE("sp"."LAST_NAME", ''))) AS "DELIVERED_BY_NAME",
          "dr"."DELIVERY_DATE" AS "DELIVERY_DATE",
          "dr"."RECEIVED_BY_NAME" AS "RECEIVED_BY_NAME",
          "dr"."RECEIVED_BY_DOCUMENT" AS "RECEIVED_BY_DOCUMENT",
          "dr"."RECEIVED_BY_PHONE" AS "RECEIVED_BY_PHONE",
          "dr"."OBSERVATIONS" AS "OBSERVATIONS",
          "dr"."STATE" AS "STATE",
          "dr"."CREATED_AT" AS "CREATED_AT"
        FROM "DELIVERY_RECEIPT" "dr"
        INNER JOIN "WORK_ORDER" "wo"
          ON "wo"."WORK_ORDER_ID" = "dr"."WORK_ORDER_ID"
        INNER JOIN "PERSON" "c"
          ON "c"."PERSON_ID" = "wo"."CUSTOMER_ID"
        INNER JOIN "VEHICLE" "v"
          ON "v"."VEHICLE_ID" = "wo"."VEHICLE_ID"
        LEFT JOIN "STAFF" "s"
          ON "s"."STAFF_ID" = "dr"."DELIVERED_BY_STAFF_ID"
        LEFT JOIN "PERSON" "sp"
          ON "sp"."PERSON_ID" = "s"."PERSON_ID"
        WHERE "dr"."BUSINESS_ID" = ${Number(businessId)}
      ) AS "delivery_receipt_rows"
      ${whereClause}
      ORDER BY "DELIVERY_RECEIPT_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<DeliveryReceiptPaginationRow>({
      statement,
      values,
      pagination,
    })

    return this.success({
      data: data.map((item) => this.mapPaginatedSummary(item)),
      metadata,
    })
  }

  private async buildResponse(
    receiptId: number,
    businessId: number
  ): Promise<DeliveryReceiptResponse> {
    const receipt = await this.deliveryReceiptRepository.findOne({
      where: { DELIVERY_RECEIPT_ID: receiptId, BUSINESS_ID: businessId },
      relations: [
        'WORK_ORDER',
        'WORK_ORDER.CUSTOMER',
        'WORK_ORDER.VEHICLE',
        'DELIVERED_BY',
        'DELIVERED_BY.PERSON',
      ],
    })

    if (!receipt) {
      throw new NotFoundError(
        `Comprobante de entrega con id '${receiptId}' no encontrado.`
      )
    }

    return this.mapSummary(receipt)
  }

  private mapSummary(receipt: DeliveryReceipt): DeliveryReceiptResponse {
    return {
      DELIVERY_RECEIPT_ID: receipt.DELIVERY_RECEIPT_ID,
      RECEIPT_NO: receipt.RECEIPT_NO || '',
      WORK_ORDER_ID: receipt.WORK_ORDER_ID,
      WORK_ORDER_NO: receipt.WORK_ORDER?.ORDER_NO || '',
      CUSTOMER_NAME: this.getPersonName(receipt.WORK_ORDER?.CUSTOMER),
      VEHICLE_LABEL: this.getVehicleLabel(receipt.WORK_ORDER?.VEHICLE),
      DELIVERED_BY_STAFF_ID: receipt.DELIVERED_BY_STAFF_ID,
      DELIVERED_BY_NAME: this.getStaffName(receipt.DELIVERED_BY),
      DELIVERY_DATE: receipt.DELIVERY_DATE,
      RECEIVED_BY_NAME: receipt.RECEIVED_BY_NAME || '',
      RECEIVED_BY_DOCUMENT: receipt.RECEIVED_BY_DOCUMENT || '',
      RECEIVED_BY_PHONE: receipt.RECEIVED_BY_PHONE || '',
      OBSERVATIONS: receipt.OBSERVATIONS || '',
      STATE: receipt.STATE || 'A',
      CREATED_AT: receipt.CREATED_AT,
    }
  }

  private mapPaginatedSummary(
    receipt: DeliveryReceiptPaginationRow
  ): DeliveryReceiptResponse {
    return {
      DELIVERY_RECEIPT_ID: Number(receipt.DELIVERY_RECEIPT_ID),
      RECEIPT_NO: receipt.RECEIPT_NO || '',
      WORK_ORDER_ID: Number(receipt.WORK_ORDER_ID),
      WORK_ORDER_NO: receipt.WORK_ORDER_NO || '',
      CUSTOMER_NAME: receipt.CUSTOMER_NAME || '',
      VEHICLE_LABEL: receipt.VEHICLE_LABEL || '',
      DELIVERED_BY_STAFF_ID: Number(receipt.DELIVERED_BY_STAFF_ID),
      DELIVERED_BY_NAME: receipt.DELIVERED_BY_NAME || '',
      DELIVERY_DATE: receipt.DELIVERY_DATE,
      RECEIVED_BY_NAME: receipt.RECEIVED_BY_NAME || '',
      RECEIVED_BY_DOCUMENT: receipt.RECEIVED_BY_DOCUMENT || '',
      RECEIVED_BY_PHONE: receipt.RECEIVED_BY_PHONE || '',
      OBSERVATIONS: receipt.OBSERVATIONS || '',
      STATE: receipt.STATE || 'A',
      CREATED_AT: receipt.CREATED_AT || null,
    }
  }

  private async resolveDeliveredStatus(manager: any, businessId: number) {
    const status = await manager.getRepository(WorkOrderStatus).findOne({
      where: [
        { CODE: 'ENTREGADA', BUSINESS_ID: null, STATE: 'A' },
        { CODE: 'ENTREGADA', BUSINESS_ID: businessId, STATE: 'A' },
      ],
      order: { BUSINESS_ID: 'DESC' as never },
    })

    if (!status) {
      throw new NotFoundError('Estado ENTREGADA no configurado.')
    }

    return status
  }

  private buildReceiptNo(receiptId: number): string {
    return `ENT-${String(receiptId).padStart(6, '0')}`
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

  private normalizeDate(value?: Date | string | null): Date | null {
    if (!value) return null

    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('La fecha indicada no es valida.')
    }

    return date
  }

  private getPersonName(person?: Person | null): string {
    if (!person) return ''
    return `${person.NAME || ''} ${person.LAST_NAME || ''}`.trim()
  }

  private getStaffName(staff?: Staff | null): string {
    if (!staff) return ''
    return this.getPersonName(staff.PERSON)
  }

  private getVehicleLabel(vehicle?: Vehicle | null): string {
    if (!vehicle) return ''

    return [vehicle.PLATE, vehicle.BRAND, vehicle.MODEL]
      .filter(Boolean)
      .join(' - ')
      .trim()
  }

}
