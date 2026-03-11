import { Article } from '@entity/Article'
import { Person } from '@entity/Person'
import { Staff } from '@entity/Staff'
import { Vehicle } from '@entity/Vehicle'
import { WorkOrder } from '@entity/WorkOrder'
import { WorkOrderConsumedItem } from '@entity/WorkOrderConsumedItem'
import { WorkOrderServiceLine } from '@entity/WorkOrderServiceLine'
import { WorkOrderStatus } from '@entity/WorkOrderStatus'
import { WorkOrderStatusHistory } from '@entity/WorkOrderStatusHistory'
import { WorkOrderTechnician } from '@entity/WorkOrderTechnician'
import {
  BadRequestError,
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
import {
  InventoryMovementService,
  INVENTORY_MOVEMENT_TYPES,
} from './inventory-movement.service'

type WorkOrderServiceLinePayload = {
  SERVICE_TYPE?: string
  DESCRIPTION?: string
  QUANTITY?: number
  REFERENCE_AMOUNT?: number
  NOTES?: string | null
}

type WorkOrderConsumedItemPayload = {
  ARTICLE_ID: number
  QUANTITY: number
  UNIT_COST_REFERENCE?: number | null
  NOTES?: string | null
}

type WorkOrderTechnicianPayload = {
  STAFF_ID: number
  ROLE_ON_JOB?: string | null
  IS_LEAD?: boolean
  REFERENCE_PERCENT?: number | null
  REFERENCE_AMOUNT?: number | null
  NOTES?: string | null
}

type WorkOrderPayload = {
  WORK_ORDER_ID?: number
  CUSTOMER_ID?: number
  VEHICLE_ID?: number
  STATUS_ID?: number
  PROMISED_AT?: Date | string | null
  SYMPTOM?: string
  DIAGNOSIS?: string | null
  WORK_PERFORMED?: string | null
  INTERNAL_NOTES?: string | null
  CUSTOMER_OBSERVATIONS?: string | null
  REQUIRES_DISASSEMBLY?: boolean
  STATUS_CHANGE_NOTES?: string | null
  SERVICE_LINES?: WorkOrderServiceLinePayload[]
  CONSUMED_ITEMS?: WorkOrderConsumedItemPayload[]
  TECHNICIANS?: WorkOrderTechnicianPayload[]
  STATE?: string
}

type WorkOrderStatusResponse = {
  STATUS_ID: number
  CODE: string
  NAME: string
  DESCRIPTION: string
  IS_FINAL: boolean
  ORDER_INDEX: number
  STATE: string
}

type WorkOrderServiceLineResponse = {
  SERVICE_LINE_ID: number
  SERVICE_TYPE: string
  DESCRIPTION: string
  QUANTITY: number
  REFERENCE_AMOUNT: number
  NOTES: string
}

type WorkOrderConsumedItemResponse = {
  CONSUMED_ITEM_ID: number
  ARTICLE_ID: number
  ARTICLE_CODE: string
  ARTICLE_NAME: string
  QUANTITY: number
  UNIT_COST_REFERENCE: number | null
  NOTES: string
}

type WorkOrderTechnicianResponse = {
  WORK_ORDER_TECHNICIAN_ID: number
  STAFF_ID: number
  STAFF_NAME: string
  ROLE_ON_JOB: string
  IS_LEAD: boolean
  REFERENCE_PERCENT: number | null
  REFERENCE_AMOUNT: number | null
  NOTES: string
}

type WorkOrderStatusHistoryResponse = {
  HISTORY_ID: number
  STATUS_ID: number
  STATUS_CODE: string
  STATUS_NAME: string
  CHANGED_BY_STAFF_ID: number
  CHANGED_BY_NAME: string
  CHANGED_AT: Date
  NOTES: string
}

export type WorkOrderResponse = {
  WORK_ORDER_ID: number
  ORDER_NO: string
  CUSTOMER_ID: number
  CUSTOMER_NAME: string
  VEHICLE_ID: number
  VEHICLE_LABEL: string
  STATUS_ID: number
  STATUS_CODE: string
  STATUS_NAME: string
  RECEIVED_BY_STAFF_ID: number
  RECEIVED_BY_NAME: string
  DELIVERED_BY_STAFF_ID: number | null
  DELIVERED_BY_NAME: string
  OPENED_AT: Date
  PROMISED_AT: Date | null
  CLOSED_AT: Date | null
  CANCELLED_AT: Date | null
  SYMPTOM: string
  DIAGNOSIS: string
  WORK_PERFORMED: string
  INTERNAL_NOTES: string
  CUSTOMER_OBSERVATIONS: string
  REQUIRES_DISASSEMBLY: boolean
  STATE: string
  SERVICE_LINES?: WorkOrderServiceLineResponse[]
  CONSUMED_ITEMS?: WorkOrderConsumedItemResponse[]
  TECHNICIANS?: WorkOrderTechnicianResponse[]
  STATUS_HISTORY?: WorkOrderStatusHistoryResponse[]
  CREATED_AT?: Date | null
}

type WorkOrderPaginationRow = {
  WORK_ORDER_ID: number | string
  ORDER_NO: string | null
  CUSTOMER_ID: number | string
  CUSTOMER_NAME: string | null
  VEHICLE_ID: number | string
  VEHICLE_LABEL: string | null
  STATUS_ID: number | string
  STATUS_CODE: string | null
  STATUS_NAME: string | null
  RECEIVED_BY_STAFF_ID: number | string
  RECEIVED_BY_NAME: string | null
  DELIVERED_BY_STAFF_ID: number | string | null
  DELIVERED_BY_NAME: string | null
  OPENED_AT: Date | string
  PROMISED_AT: Date | string | null
  CLOSED_AT: Date | string | null
  CANCELLED_AT: Date | string | null
  SYMPTOM: string | null
  DIAGNOSIS: string | null
  WORK_PERFORMED: string | null
  INTERNAL_NOTES: string | null
  CUSTOMER_OBSERVATIONS: string | null
  REQUIRES_DISASSEMBLY: boolean | string | number | null
  STATE: string | null
  CREATED_AT: Date | string | null
}

export class WorkOrderService extends BaseService {
  private workOrderRepository: Repository<WorkOrder>
  private workOrderStatusRepository: Repository<WorkOrderStatus>
  private inventoryMovementService: InventoryMovementService

  constructor() {
    super()
    this.workOrderRepository = this.datasource.getRepository(WorkOrder)
    this.workOrderStatusRepository = this.datasource.getRepository(WorkOrderStatus)
    this.inventoryMovementService = new InventoryMovementService()
  }

  @CatchServiceError()
  async create(
    payload: WorkOrderPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkOrderResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const serviceLines = this.normalizeServiceLines(payload.SERVICE_LINES || [])
    const consumedItems = this.normalizeConsumedItems(payload.CONSUMED_ITEMS || [])
    const technicians = this.normalizeTechnicians(payload.TECHNICIANS || [])
    const symptom = this.normalizeRequiredText(payload.SYMPTOM, 'SYMPTOM')
    const promisedAt = this.normalizeDate(payload.PROMISED_AT)

    let createdWorkOrderId = 0

    await this.datasource.transaction(async (manager) => {
      const status = await this.resolveStatus(
        manager,
        businessId,
        payload.STATUS_ID,
        'CREADA'
      )

      if (status.IS_FINAL) {
        throw new BadRequestError(
          'No puede crear una orden directamente en un estado final.'
        )
      }

      const customerId = Number(payload.CUSTOMER_ID)
      const vehicleId = Number(payload.VEHICLE_ID)

      if (!customerId || !vehicleId) {
        throw new BadRequestError(
          'Los campos CUSTOMER_ID y VEHICLE_ID son requeridos.'
        )
      }

      await this.assertCustomerAndVehicle(
        manager,
        businessId,
        customerId,
        vehicleId
      )
      await this.assertTechnicians(manager, businessId, technicians)
      await this.assertArticleAvailability(manager, businessId, consumedItems)

      const workOrderRepo = manager.getRepository(WorkOrder)
      const workOrder = workOrderRepo.create({
        BUSINESS_ID: businessId,
        CUSTOMER_ID: customerId,
        VEHICLE_ID: vehicleId,
        STATUS_ID: status.STATUS_ID,
        RECEIVED_BY_STAFF_ID: sessionInfo.userId,
        OPENED_AT: new Date(),
        PROMISED_AT: promisedAt,
        SYMPTOM: symptom,
        DIAGNOSIS: this.normalizeNullableText(payload.DIAGNOSIS),
        WORK_PERFORMED: this.normalizeNullableText(payload.WORK_PERFORMED),
        INTERNAL_NOTES: this.normalizeNullableText(payload.INTERNAL_NOTES),
        CUSTOMER_OBSERVATIONS: this.normalizeNullableText(
          payload.CUSTOMER_OBSERVATIONS
        ),
        REQUIRES_DISASSEMBLY: Boolean(payload.REQUIRES_DISASSEMBLY),
        STATE: payload.STATE || 'A',
        CREATED_BY: sessionInfo.userId,
      })

      const saved = await workOrderRepo.save(workOrder)
      saved.ORDER_NO = this.buildOrderNo(saved.WORK_ORDER_ID)
      await workOrderRepo.save(saved)

      createdWorkOrderId = saved.WORK_ORDER_ID

      await this.replaceServiceLines(
        manager,
        createdWorkOrderId,
        serviceLines,
        sessionInfo.userId
      )
      await this.replaceConsumedItems(
        manager,
        createdWorkOrderId,
        consumedItems,
        sessionInfo.userId
      )
      await this.replaceTechnicians(
        manager,
        createdWorkOrderId,
        technicians,
        sessionInfo.userId
      )
      await this.registerConsumedItemDeltaMovement(
        manager,
        businessId,
        createdWorkOrderId,
        [],
        consumedItems,
        sessionInfo.userId
      )
      await this.insertStatusHistory(
        manager,
        createdWorkOrderId,
        status.STATUS_ID,
        sessionInfo.userId,
        payload.STATUS_CHANGE_NOTES || null
      )
    })

    return this.success({
      data: await this.buildWorkOrderResponse(createdWorkOrderId, businessId),
    })
  }

  @CatchServiceError()
  async update(
    payload: WorkOrderPayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkOrderResponse>> {
    const workOrderId = Number(payload.WORK_ORDER_ID)

    if (!workOrderId) {
      throw new BadRequestError('El campo WORK_ORDER_ID es requerido.')
    }

    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    await this.datasource.transaction(async (manager) => {
      const workOrderRepo = manager.getRepository(WorkOrder)
      const workOrder = await workOrderRepo.findOne({
        where: { WORK_ORDER_ID: workOrderId, BUSINESS_ID: businessId },
        relations: ['STATUS'],
      })

      if (!workOrder) {
        throw new NotFoundError(
          `Orden de trabajo con id '${workOrderId}' no encontrada.`
        )
      }

      const currentStatus = workOrder.STATUS
      if (this.isFinalStatus(currentStatus.CODE)) {
        throw new BadRequestError(
          'No puede modificar una orden que ya fue entregada o cancelada.'
        )
      }

      const nextStatus =
        payload.STATUS_ID !== undefined
          ? await this.resolveStatus(manager, businessId, payload.STATUS_ID)
          : currentStatus

      const serviceLinesProvided = payload.SERVICE_LINES !== undefined
      const consumedItemsProvided = payload.CONSUMED_ITEMS !== undefined
      const techniciansProvided = payload.TECHNICIANS !== undefined

      if (
        nextStatus.CODE === 'CANCELADA' &&
        (serviceLinesProvided || consumedItemsProvided || techniciansProvided)
      ) {
        throw new BadRequestError(
          'Para cancelar la orden no debe modificar lineas de servicio, consumo ni tecnicos en la misma operacion.'
        )
      }

      const currentConsumedItems = await manager
        .getRepository(WorkOrderConsumedItem)
        .find({ where: { WORK_ORDER_ID: workOrderId } })

      const nextConsumedItems =
        payload.CONSUMED_ITEMS !== undefined
          ? this.normalizeConsumedItems(payload.CONSUMED_ITEMS)
          : currentConsumedItems.map((item) => ({
              ARTICLE_ID: item.ARTICLE_ID,
              QUANTITY: this.toNumber(item.QUANTITY),
              UNIT_COST_REFERENCE:
                item.UNIT_COST_REFERENCE === null
                  ? null
                  : this.toNumber(item.UNIT_COST_REFERENCE),
              NOTES: item.NOTES,
            }))

      const customerId =
        payload.CUSTOMER_ID !== undefined
          ? Number(payload.CUSTOMER_ID)
          : workOrder.CUSTOMER_ID
      const vehicleId =
        payload.VEHICLE_ID !== undefined
          ? Number(payload.VEHICLE_ID)
          : workOrder.VEHICLE_ID

      await this.assertCustomerAndVehicle(
        manager,
        businessId,
        customerId,
        vehicleId
      )

      if (techniciansProvided) {
        await this.assertTechnicians(
          manager,
          businessId,
          this.normalizeTechnicians(payload.TECHNICIANS || [])
        )
      }

      if (consumedItemsProvided) {
        await this.assertArticleAvailability(manager, businessId, nextConsumedItems)
      }

      if (payload.CUSTOMER_ID !== undefined) workOrder.CUSTOMER_ID = customerId
      if (payload.VEHICLE_ID !== undefined) workOrder.VEHICLE_ID = vehicleId
      if (payload.STATUS_ID !== undefined) workOrder.STATUS_ID = nextStatus.STATUS_ID
      if (payload.PROMISED_AT !== undefined) {
        workOrder.PROMISED_AT = this.normalizeDate(payload.PROMISED_AT)
      }
      if (payload.SYMPTOM !== undefined) {
        workOrder.SYMPTOM = this.normalizeRequiredText(payload.SYMPTOM, 'SYMPTOM')
      }
      if (payload.DIAGNOSIS !== undefined) {
        workOrder.DIAGNOSIS = this.normalizeNullableText(payload.DIAGNOSIS)
      }
      if (payload.WORK_PERFORMED !== undefined) {
        workOrder.WORK_PERFORMED = this.normalizeNullableText(
          payload.WORK_PERFORMED
        )
      }
      if (payload.INTERNAL_NOTES !== undefined) {
        workOrder.INTERNAL_NOTES = this.normalizeNullableText(payload.INTERNAL_NOTES)
      }
      if (payload.CUSTOMER_OBSERVATIONS !== undefined) {
        workOrder.CUSTOMER_OBSERVATIONS = this.normalizeNullableText(
          payload.CUSTOMER_OBSERVATIONS
        )
      }
      if (payload.REQUIRES_DISASSEMBLY !== undefined) {
        workOrder.REQUIRES_DISASSEMBLY = Boolean(payload.REQUIRES_DISASSEMBLY)
      }
      if (payload.STATE) {
        workOrder.STATE = payload.STATE
      }

      if (nextStatus.CODE === 'ENTREGADA') {
        workOrder.CLOSED_AT = new Date()
        workOrder.DELIVERED_BY_STAFF_ID = sessionInfo.userId
      }

      if (nextStatus.CODE === 'CANCELADA') {
        workOrder.CANCELLED_AT = new Date()
      }

      workOrder.UPDATED_BY = sessionInfo.userId
      await workOrderRepo.save(workOrder)

      if (serviceLinesProvided) {
        await this.replaceServiceLines(
          manager,
          workOrderId,
          this.normalizeServiceLines(payload.SERVICE_LINES || []),
          sessionInfo.userId
        )
      }

      if (consumedItemsProvided) {
        await this.registerConsumedItemDeltaMovement(
          manager,
          businessId,
          workOrderId,
          currentConsumedItems.map((item) => ({
            ARTICLE_ID: item.ARTICLE_ID,
            QUANTITY: this.toNumber(item.QUANTITY),
            UNIT_COST_REFERENCE:
              item.UNIT_COST_REFERENCE === null
                ? null
              : this.toNumber(item.UNIT_COST_REFERENCE),
            NOTES: item.NOTES,
          })),
          nextConsumedItems,
          sessionInfo.userId
        )
        await this.replaceConsumedItems(
          manager,
          workOrderId,
          nextConsumedItems,
          sessionInfo.userId
        )
      }

      if (techniciansProvided) {
        await this.replaceTechnicians(
          manager,
          workOrderId,
          this.normalizeTechnicians(payload.TECHNICIANS || []),
          sessionInfo.userId
        )
      }

      if (currentStatus.STATUS_ID !== nextStatus.STATUS_ID) {
        if (nextStatus.CODE === 'CANCELADA') {
          await this.registerConsumedItemDeltaMovement(
            manager,
            businessId,
            workOrderId,
            currentConsumedItems.map((item) => ({
              ARTICLE_ID: item.ARTICLE_ID,
              QUANTITY: this.toNumber(item.QUANTITY),
              UNIT_COST_REFERENCE:
                item.UNIT_COST_REFERENCE === null
                  ? null
                  : this.toNumber(item.UNIT_COST_REFERENCE),
              NOTES: item.NOTES,
            })),
            [],
            sessionInfo.userId
          )
        }

        await this.insertStatusHistory(
          manager,
          workOrderId,
          nextStatus.STATUS_ID,
          sessionInfo.userId,
          payload.STATUS_CHANGE_NOTES || null
        )
      }
    })

    return this.success({
      data: await this.buildWorkOrderResponse(workOrderId, businessId),
    })
  }

  @CatchServiceError()
  async getOne(workOrderId: number): Promise<ApiResponse<WorkOrderResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    return this.success({
      data: await this.buildWorkOrderResponse(workOrderId, businessId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<WorkOrder>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<WorkOrderResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedConditions = preparePaginationConditions(conditions, [
      'ORDER_NO',
      'SYMPTOM',
      'DIAGNOSIS',
      'WORK_PERFORMED',
      'CUSTOMER_NAME',
      'VEHICLE_PLATE',
      'VEHICLE_BRAND',
      'VEHICLE_MODEL',
      'STATUS_NAME',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "WORK_ORDER_ID",
        "ORDER_NO",
        "CUSTOMER_ID",
        "CUSTOMER_NAME",
        "VEHICLE_ID",
        "VEHICLE_LABEL",
        "STATUS_ID",
        "STATUS_CODE",
        "STATUS_NAME",
        "RECEIVED_BY_STAFF_ID",
        "RECEIVED_BY_NAME",
        "DELIVERED_BY_STAFF_ID",
        "DELIVERED_BY_NAME",
        "OPENED_AT",
        "PROMISED_AT",
        "CLOSED_AT",
        "CANCELLED_AT",
        "SYMPTOM",
        "DIAGNOSIS",
        "WORK_PERFORMED",
        "INTERNAL_NOTES",
        "CUSTOMER_OBSERVATIONS",
        "REQUIRES_DISASSEMBLY",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "wo"."WORK_ORDER_ID" AS "WORK_ORDER_ID",
          "wo"."ORDER_NO" AS "ORDER_NO",
          "wo"."CUSTOMER_ID" AS "CUSTOMER_ID",
          TRIM(CONCAT(COALESCE("c"."NAME", ''), ' ', COALESCE("c"."LAST_NAME", ''))) AS "CUSTOMER_NAME",
          "wo"."VEHICLE_ID" AS "VEHICLE_ID",
          TRIM(CONCAT(COALESCE("v"."PLATE", ''), ' ', COALESCE("v"."BRAND", ''), ' ', COALESCE("v"."MODEL", ''))) AS "VEHICLE_LABEL",
          "v"."PLATE" AS "VEHICLE_PLATE",
          "v"."BRAND" AS "VEHICLE_BRAND",
          "v"."MODEL" AS "VEHICLE_MODEL",
          "wo"."STATUS_ID" AS "STATUS_ID",
          "s"."CODE" AS "STATUS_CODE",
          "s"."NAME" AS "STATUS_NAME",
          "wo"."RECEIVED_BY_STAFF_ID" AS "RECEIVED_BY_STAFF_ID",
          TRIM(CONCAT(COALESCE("rp"."NAME", ''), ' ', COALESCE("rp"."LAST_NAME", ''))) AS "RECEIVED_BY_NAME",
          "wo"."DELIVERED_BY_STAFF_ID" AS "DELIVERED_BY_STAFF_ID",
          TRIM(CONCAT(COALESCE("dp"."NAME", ''), ' ', COALESCE("dp"."LAST_NAME", ''))) AS "DELIVERED_BY_NAME",
          "wo"."OPENED_AT" AS "OPENED_AT",
          "wo"."PROMISED_AT" AS "PROMISED_AT",
          "wo"."CLOSED_AT" AS "CLOSED_AT",
          "wo"."CANCELLED_AT" AS "CANCELLED_AT",
          "wo"."SYMPTOM" AS "SYMPTOM",
          "wo"."DIAGNOSIS" AS "DIAGNOSIS",
          "wo"."WORK_PERFORMED" AS "WORK_PERFORMED",
          "wo"."INTERNAL_NOTES" AS "INTERNAL_NOTES",
          "wo"."CUSTOMER_OBSERVATIONS" AS "CUSTOMER_OBSERVATIONS",
          "wo"."REQUIRES_DISASSEMBLY" AS "REQUIRES_DISASSEMBLY",
          "wo"."STATE" AS "STATE",
          "wo"."CREATED_AT" AS "CREATED_AT"
        FROM "WORK_ORDER" "wo"
        INNER JOIN "PERSON" "c"
          ON "c"."PERSON_ID" = "wo"."CUSTOMER_ID"
        INNER JOIN "VEHICLE" "v"
          ON "v"."VEHICLE_ID" = "wo"."VEHICLE_ID"
        INNER JOIN "WORK_ORDER_STATUS" "s"
          ON "s"."STATUS_ID" = "wo"."STATUS_ID"
        LEFT JOIN "STAFF" "rs"
          ON "rs"."STAFF_ID" = "wo"."RECEIVED_BY_STAFF_ID"
        LEFT JOIN "PERSON" "rp"
          ON "rp"."PERSON_ID" = "rs"."PERSON_ID"
        LEFT JOIN "STAFF" "ds"
          ON "ds"."STAFF_ID" = "wo"."DELIVERED_BY_STAFF_ID"
        LEFT JOIN "PERSON" "dp"
          ON "dp"."PERSON_ID" = "ds"."PERSON_ID"
        WHERE "wo"."BUSINESS_ID" = ${Number(businessId)}
      ) AS "work_order_rows"
      ${whereClause}
      ORDER BY "WORK_ORDER_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<WorkOrderPaginationRow>({
      statement,
      values,
      pagination,
    })

    return this.success({
      data: data.map((item) => this.mapPaginatedWorkOrderRow(item)),
      metadata,
    })
  }

  @CatchServiceError()
  async getStatusList(): Promise<ApiResponse<WorkOrderStatusResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const statuses = await this.workOrderStatusRepository.find({
      where: [{ BUSINESS_ID: null, STATE: 'A' }, { BUSINESS_ID: businessId, STATE: 'A' }],
      order: { ORDER_INDEX: 'ASC', STATUS_ID: 'ASC' },
    })

    return this.success({
      data: statuses.map((status) => ({
        STATUS_ID: status.STATUS_ID,
        CODE: status.CODE,
        NAME: status.NAME,
        DESCRIPTION: status.DESCRIPTION || '',
        IS_FINAL: Boolean(status.IS_FINAL),
        ORDER_INDEX: status.ORDER_INDEX,
        STATE: status.STATE || 'A',
      })),
    })
  }

  private async buildWorkOrderResponse(
    workOrderId: number,
    businessId: number
  ): Promise<WorkOrderResponse> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { WORK_ORDER_ID: workOrderId, BUSINESS_ID: businessId },
      relations: [
        'CUSTOMER',
        'VEHICLE',
        'STATUS',
        'RECEIVED_BY',
        'RECEIVED_BY.PERSON',
        'DELIVERED_BY',
        'DELIVERED_BY.PERSON',
        'SERVICE_LINES',
        'CONSUMED_ITEMS',
        'CONSUMED_ITEMS.ARTICLE',
        'TECHNICIANS',
        'TECHNICIANS.STAFF',
        'TECHNICIANS.STAFF.PERSON',
        'STATUS_HISTORY',
        'STATUS_HISTORY.STATUS',
        'STATUS_HISTORY.CHANGED_BY',
        'STATUS_HISTORY.CHANGED_BY.PERSON',
      ],
    })

    if (!workOrder) {
      throw new NotFoundError(
        `Orden de trabajo con id '${workOrderId}' no encontrada.`
      )
    }

    return this.mapWorkOrderDetail(workOrder)
  }

  private mapWorkOrderSummary(workOrder: WorkOrder): WorkOrderResponse {
    return {
      WORK_ORDER_ID: workOrder.WORK_ORDER_ID,
      ORDER_NO: workOrder.ORDER_NO || '',
      CUSTOMER_ID: workOrder.CUSTOMER_ID,
      CUSTOMER_NAME: this.getPersonName(workOrder.CUSTOMER),
      VEHICLE_ID: workOrder.VEHICLE_ID,
      VEHICLE_LABEL: this.getVehicleLabel(workOrder.VEHICLE),
      STATUS_ID: workOrder.STATUS_ID,
      STATUS_CODE: workOrder.STATUS?.CODE || '',
      STATUS_NAME: workOrder.STATUS?.NAME || '',
      RECEIVED_BY_STAFF_ID: workOrder.RECEIVED_BY_STAFF_ID,
      RECEIVED_BY_NAME: '',
      DELIVERED_BY_STAFF_ID: workOrder.DELIVERED_BY_STAFF_ID ?? null,
      DELIVERED_BY_NAME: '',
      OPENED_AT: workOrder.OPENED_AT,
      PROMISED_AT: workOrder.PROMISED_AT,
      CLOSED_AT: workOrder.CLOSED_AT,
      CANCELLED_AT: workOrder.CANCELLED_AT,
      SYMPTOM: workOrder.SYMPTOM || '',
      DIAGNOSIS: workOrder.DIAGNOSIS || '',
      WORK_PERFORMED: workOrder.WORK_PERFORMED || '',
      INTERNAL_NOTES: workOrder.INTERNAL_NOTES || '',
      CUSTOMER_OBSERVATIONS: workOrder.CUSTOMER_OBSERVATIONS || '',
      REQUIRES_DISASSEMBLY: Boolean(workOrder.REQUIRES_DISASSEMBLY),
      STATE: workOrder.STATE || 'A',
      CREATED_AT: workOrder.CREATED_AT,
    }
  }

  private mapPaginatedWorkOrderRow(
    workOrder: WorkOrderPaginationRow
  ): WorkOrderResponse {
    return {
      WORK_ORDER_ID: Number(workOrder.WORK_ORDER_ID),
      ORDER_NO: workOrder.ORDER_NO || '',
      CUSTOMER_ID: Number(workOrder.CUSTOMER_ID),
      CUSTOMER_NAME: workOrder.CUSTOMER_NAME || '',
      VEHICLE_ID: Number(workOrder.VEHICLE_ID),
      VEHICLE_LABEL: workOrder.VEHICLE_LABEL || '',
      STATUS_ID: Number(workOrder.STATUS_ID),
      STATUS_CODE: workOrder.STATUS_CODE || '',
      STATUS_NAME: workOrder.STATUS_NAME || '',
      RECEIVED_BY_STAFF_ID: Number(workOrder.RECEIVED_BY_STAFF_ID),
      RECEIVED_BY_NAME: workOrder.RECEIVED_BY_NAME || '',
      DELIVERED_BY_STAFF_ID:
        workOrder.DELIVERED_BY_STAFF_ID === null ||
        workOrder.DELIVERED_BY_STAFF_ID === undefined
          ? null
          : Number(workOrder.DELIVERED_BY_STAFF_ID),
      DELIVERED_BY_NAME: workOrder.DELIVERED_BY_NAME || '',
      OPENED_AT: new Date(workOrder.OPENED_AT),
      PROMISED_AT: workOrder.PROMISED_AT ? new Date(workOrder.PROMISED_AT) : null,
      CLOSED_AT: workOrder.CLOSED_AT ? new Date(workOrder.CLOSED_AT) : null,
      CANCELLED_AT: workOrder.CANCELLED_AT
        ? new Date(workOrder.CANCELLED_AT)
        : null,
      SYMPTOM: workOrder.SYMPTOM || '',
      DIAGNOSIS: workOrder.DIAGNOSIS || '',
      WORK_PERFORMED: workOrder.WORK_PERFORMED || '',
      INTERNAL_NOTES: workOrder.INTERNAL_NOTES || '',
      CUSTOMER_OBSERVATIONS: workOrder.CUSTOMER_OBSERVATIONS || '',
      REQUIRES_DISASSEMBLY: this.toBoolean(workOrder.REQUIRES_DISASSEMBLY),
      STATE: workOrder.STATE || 'A',
      CREATED_AT: workOrder.CREATED_AT ? new Date(workOrder.CREATED_AT) : null,
    }
  }

  private mapWorkOrderDetail(workOrder: WorkOrder): WorkOrderResponse {
    return {
      ...this.mapWorkOrderSummary(workOrder),
      RECEIVED_BY_NAME: this.getStaffName(workOrder.RECEIVED_BY),
      DELIVERED_BY_NAME: this.getStaffName(workOrder.DELIVERED_BY),
      SERVICE_LINES: (workOrder.SERVICE_LINES || [])
        .sort((a, b) => a.SERVICE_LINE_ID - b.SERVICE_LINE_ID)
        .map((line) => ({
          SERVICE_LINE_ID: line.SERVICE_LINE_ID,
          SERVICE_TYPE: line.SERVICE_TYPE || '',
          DESCRIPTION: line.DESCRIPTION || '',
          QUANTITY: this.toNumber(line.QUANTITY),
          REFERENCE_AMOUNT: this.toNumber(line.REFERENCE_AMOUNT),
          NOTES: line.NOTES || '',
        })),
      CONSUMED_ITEMS: (workOrder.CONSUMED_ITEMS || [])
        .sort((a, b) => a.CONSUMED_ITEM_ID - b.CONSUMED_ITEM_ID)
        .map((line) => ({
          CONSUMED_ITEM_ID: line.CONSUMED_ITEM_ID,
          ARTICLE_ID: line.ARTICLE_ID,
          ARTICLE_CODE: line.ARTICLE?.CODE || '',
          ARTICLE_NAME: line.ARTICLE?.NAME || '',
          QUANTITY: this.toNumber(line.QUANTITY),
          UNIT_COST_REFERENCE:
            line.UNIT_COST_REFERENCE === null
              ? null
              : this.toNumber(line.UNIT_COST_REFERENCE),
          NOTES: line.NOTES || '',
        })),
      TECHNICIANS: (workOrder.TECHNICIANS || [])
        .sort(
          (a, b) => a.WORK_ORDER_TECHNICIAN_ID - b.WORK_ORDER_TECHNICIAN_ID
        )
        .map((line) => ({
          WORK_ORDER_TECHNICIAN_ID: line.WORK_ORDER_TECHNICIAN_ID,
          STAFF_ID: line.STAFF_ID,
          STAFF_NAME: this.getStaffName(line.STAFF),
          ROLE_ON_JOB: line.ROLE_ON_JOB || '',
          IS_LEAD: Boolean(line.IS_LEAD),
          REFERENCE_PERCENT:
            line.REFERENCE_PERCENT === null
              ? null
              : this.toNumber(line.REFERENCE_PERCENT),
          REFERENCE_AMOUNT:
            line.REFERENCE_AMOUNT === null
              ? null
              : this.toNumber(line.REFERENCE_AMOUNT),
          NOTES: line.NOTES || '',
        })),
      STATUS_HISTORY: (workOrder.STATUS_HISTORY || [])
        .sort((a, b) => {
          return new Date(b.CHANGED_AT).getTime() - new Date(a.CHANGED_AT).getTime()
        })
        .map((line) => ({
          HISTORY_ID: line.HISTORY_ID,
          STATUS_ID: line.STATUS_ID,
          STATUS_CODE: line.STATUS?.CODE || '',
          STATUS_NAME: line.STATUS?.NAME || '',
          CHANGED_BY_STAFF_ID: line.CHANGED_BY_STAFF_ID,
          CHANGED_BY_NAME: this.getStaffName(line.CHANGED_BY),
          CHANGED_AT: line.CHANGED_AT,
          NOTES: line.NOTES || '',
        })),
    }
  }

  private async resolveStatus(
    manager: any,
    businessId: number,
    statusId?: number,
    fallbackCode = 'CREADA'
  ): Promise<WorkOrderStatus> {
    const statusRepo = manager.getRepository(WorkOrderStatus)

    const status = statusId
      ? await statusRepo.findOne({
          where: [
            { STATUS_ID: statusId, BUSINESS_ID: null, STATE: 'A' },
            { STATUS_ID: statusId, BUSINESS_ID: businessId, STATE: 'A' },
          ],
        })
      : await statusRepo.findOne({
          where: [
            { CODE: fallbackCode, BUSINESS_ID: null, STATE: 'A' },
            { CODE: fallbackCode, BUSINESS_ID: businessId, STATE: 'A' },
          ],
          order: { BUSINESS_ID: 'DESC' as never },
        })

    if (!status) {
      throw new NotFoundError('Estado de orden de trabajo no encontrado.')
    }

    return status
  }

  private async assertCustomerAndVehicle(
    manager: any,
    businessId: number,
    customerId: number,
    vehicleId: number
  ): Promise<void> {
    const person = await manager.getRepository(Person).findOne({
      where: { PERSON_ID: customerId, BUSINESS_ID: businessId },
      relations: ['STAFF'],
    })

    if (!person) {
      throw new NotFoundError(`Cliente con id '${customerId}' no encontrado.`)
    }

    if (person.STAFF) {
      throw new BadRequestError(
        'La persona seleccionada tiene acceso al sistema y no puede usarse como cliente.'
      )
    }

    if (person.STATE !== 'A') {
      throw new BadRequestError('El cliente seleccionado se encuentra inactivo.')
    }

    const vehicle = await manager.getRepository(Vehicle).findOne({
      where: { VEHICLE_ID: vehicleId, BUSINESS_ID: businessId },
    })

    if (!vehicle) {
      throw new NotFoundError(`Vehiculo con id '${vehicleId}' no encontrado.`)
    }

    if (vehicle.STATE !== 'A') {
      throw new BadRequestError('El vehiculo seleccionado se encuentra inactivo.')
    }

    if (vehicle.CUSTOMER_ID !== customerId) {
      throw new BadRequestError(
        'El vehiculo seleccionado no pertenece al cliente indicado.'
      )
    }
  }

  private async assertTechnicians(
    manager: any,
    businessId: number,
    technicians: WorkOrderTechnicianPayload[]
  ): Promise<void> {
    const ids = technicians.map((item) => Number(item.STAFF_ID))
    if (!ids.length) return

    const uniqueIds = new Set(ids)
    if (uniqueIds.size !== ids.length) {
      throw new BadRequestError('No puede repetir tecnicos dentro de la orden.')
    }

    const rows = await manager.getRepository(Staff).find({
      where: { STAFF_ID: In([...uniqueIds]), BUSINESS_ID: businessId, STATE: 'A' },
    })

    if (rows.length !== uniqueIds.size) {
      throw new BadRequestError(
        'Uno o mas tecnicos no existen o no estan activos.'
      )
    }
  }

  private async assertArticleAvailability(
    manager: any,
    businessId: number,
    items: WorkOrderConsumedItemPayload[]
  ): Promise<void> {
    const ids = items.map((item) => Number(item.ARTICLE_ID))
    if (!ids.length) return

    const uniqueIds = new Set(ids)
    if (uniqueIds.size !== ids.length) {
      throw new BadRequestError('No puede repetir articulos en el consumo.')
    }

    const rows = await manager.getRepository(Article).find({
      where: { ARTICLE_ID: In([...uniqueIds]), BUSINESS_ID: businessId, STATE: 'A' },
    })

    if (rows.length !== uniqueIds.size) {
      throw new BadRequestError(
        'Uno o mas articulos no existen o se encuentran inactivos.'
      )
    }
  }

  private async replaceServiceLines(
    manager: any,
    workOrderId: number,
    lines: WorkOrderServiceLinePayload[],
    userId: number
  ): Promise<void> {
    const repo = manager.getRepository(WorkOrderServiceLine)
    await repo.delete({ WORK_ORDER_ID: workOrderId })

    if (!lines.length) return

    await repo.save(
      lines.map((line) =>
        repo.create({
          WORK_ORDER_ID: workOrderId,
          SERVICE_TYPE: line.SERVICE_TYPE || 'SERVICIO',
          DESCRIPTION: line.DESCRIPTION || '',
          QUANTITY: line.QUANTITY ?? 1,
          REFERENCE_AMOUNT: line.REFERENCE_AMOUNT ?? 0,
          NOTES: line.NOTES || null,
          CREATED_BY: userId,
          STATE: 'A',
        })
      )
    )
  }

  private async replaceConsumedItems(
    manager: any,
    workOrderId: number,
    lines: WorkOrderConsumedItemPayload[],
    userId: number
  ): Promise<void> {
    const repo = manager.getRepository(WorkOrderConsumedItem)
    await repo.delete({ WORK_ORDER_ID: workOrderId })

    if (!lines.length) return

    await repo.save(
      lines.map((line) =>
        repo.create({
          WORK_ORDER_ID: workOrderId,
          ARTICLE_ID: line.ARTICLE_ID,
          QUANTITY: line.QUANTITY,
          UNIT_COST_REFERENCE: line.UNIT_COST_REFERENCE ?? null,
          NOTES: line.NOTES || null,
          CREATED_BY: userId,
          STATE: 'A',
        })
      )
    )
  }

  private async replaceTechnicians(
    manager: any,
    workOrderId: number,
    lines: WorkOrderTechnicianPayload[],
    userId: number
  ): Promise<void> {
    const repo = manager.getRepository(WorkOrderTechnician)
    await repo.delete({ WORK_ORDER_ID: workOrderId })

    if (!lines.length) return

    await repo.save(
      lines.map((line) =>
        repo.create({
          WORK_ORDER_ID: workOrderId,
          STAFF_ID: line.STAFF_ID,
          ROLE_ON_JOB: line.ROLE_ON_JOB || null,
          IS_LEAD: Boolean(line.IS_LEAD),
          REFERENCE_PERCENT: line.REFERENCE_PERCENT ?? null,
          REFERENCE_AMOUNT: line.REFERENCE_AMOUNT ?? null,
          NOTES: line.NOTES || null,
          CREATED_BY: userId,
          STATE: 'A',
        })
      )
    )
  }

  private async insertStatusHistory(
    manager: any,
    workOrderId: number,
    statusId: number,
    changedByStaffId: number,
    notes: string | null
  ): Promise<void> {
    const repo = manager.getRepository(WorkOrderStatusHistory)
    await repo.save(
      repo.create({
        WORK_ORDER_ID: workOrderId,
        STATUS_ID: statusId,
        CHANGED_BY_STAFF_ID: changedByStaffId,
        CHANGED_AT: new Date(),
        NOTES: notes,
      })
    )
  }

  private async registerConsumedItemDeltaMovement(
    manager: any,
    businessId: number,
    workOrderId: number,
    previousItems: WorkOrderConsumedItemPayload[],
    nextItems: WorkOrderConsumedItemPayload[],
    userId: number
  ): Promise<void> {
    const deltaByArticle = new Map<number, number>()

    previousItems.forEach((item) => {
      deltaByArticle.set(
        item.ARTICLE_ID,
        (deltaByArticle.get(item.ARTICLE_ID) || 0) - Number(item.QUANTITY)
      )
    })

    nextItems.forEach((item) => {
      deltaByArticle.set(
        item.ARTICLE_ID,
        (deltaByArticle.get(item.ARTICLE_ID) || 0) + Number(item.QUANTITY)
      )
    })

    const articleIds = [...deltaByArticle.keys()]
    if (!articleIds.length) return

    const consumptionDetails: WorkOrderConsumedItemPayload[] = []
    const reversalDetails: WorkOrderConsumedItemPayload[] = []

    articleIds.forEach((articleId) => {
      const delta = Number((deltaByArticle.get(articleId) || 0).toFixed(2))
      if (!delta) return

      if (delta > 0) {
        consumptionDetails.push({
          ARTICLE_ID: articleId,
          QUANTITY: delta,
          UNIT_COST_REFERENCE:
            nextItems.find((item) => item.ARTICLE_ID === articleId)
              ?.UNIT_COST_REFERENCE ?? null,
          NOTES: 'Consumo desde orden de trabajo',
        })
        return
      }

      reversalDetails.push({
        ARTICLE_ID: articleId,
        QUANTITY: Math.abs(delta),
        UNIT_COST_REFERENCE:
          previousItems.find((item) => item.ARTICLE_ID === articleId)
            ?.UNIT_COST_REFERENCE ?? null,
        NOTES: 'Reversion de consumo desde orden de trabajo',
      })
    })

    if (consumptionDetails.length) {
      await this.inventoryMovementService.registerMovementWithinTransaction(
        manager,
        {
          businessId,
          movementType: INVENTORY_MOVEMENT_TYPES.WORK_ORDER_CONSUMPTION,
          movementDate: new Date(),
          referenceSource: 'WORK_ORDER',
          referenceId: workOrderId,
          notes: `Consumo asociado a OT ${workOrderId}`,
          details: consumptionDetails,
          userId,
          state: 'A',
        }
      )
    }

    if (reversalDetails.length) {
      await this.inventoryMovementService.registerMovementWithinTransaction(
        manager,
        {
          businessId,
          movementType: INVENTORY_MOVEMENT_TYPES.WORK_ORDER_REVERSAL,
          movementDate: new Date(),
          referenceSource: 'WORK_ORDER',
          referenceId: workOrderId,
          notes: `Reversion asociada a OT ${workOrderId}`,
          details: reversalDetails,
          userId,
          state: 'A',
        }
      )
    }
  }

  private normalizeServiceLines(
    lines: WorkOrderServiceLinePayload[]
  ): WorkOrderServiceLinePayload[] {
    return lines.map((line) => ({
      SERVICE_TYPE: this.normalizeRequiredText(
        line.SERVICE_TYPE || 'SERVICIO',
        'SERVICE_TYPE'
      ),
      DESCRIPTION: this.normalizeRequiredText(line.DESCRIPTION, 'DESCRIPTION'),
      QUANTITY: this.normalizePositiveNumber(line.QUANTITY, 'QUANTITY', 1),
      REFERENCE_AMOUNT: this.normalizeNonNegativeNumber(
        line.REFERENCE_AMOUNT,
        'REFERENCE_AMOUNT',
        0
      ),
      NOTES: this.normalizeNullableText(line.NOTES),
    }))
  }

  private normalizeConsumedItems(
    items: WorkOrderConsumedItemPayload[]
  ): WorkOrderConsumedItemPayload[] {
    return items.map((item) => ({
      ARTICLE_ID: Number(item.ARTICLE_ID),
      QUANTITY: this.normalizePositiveNumber(item.QUANTITY, 'QUANTITY'),
      UNIT_COST_REFERENCE:
        item.UNIT_COST_REFERENCE === undefined || item.UNIT_COST_REFERENCE === null
          ? null
          : this.normalizeNonNegativeNumber(
              item.UNIT_COST_REFERENCE,
              'UNIT_COST_REFERENCE'
            ),
      NOTES: this.normalizeNullableText(item.NOTES),
    }))
  }

  private normalizeTechnicians(
    items: WorkOrderTechnicianPayload[]
  ): WorkOrderTechnicianPayload[] {
    return items.map((item) => ({
      STAFF_ID: Number(item.STAFF_ID),
      ROLE_ON_JOB: this.normalizeNullableText(item.ROLE_ON_JOB),
      IS_LEAD: Boolean(item.IS_LEAD),
      REFERENCE_PERCENT:
        item.REFERENCE_PERCENT === undefined || item.REFERENCE_PERCENT === null
          ? null
          : this.normalizeBoundedNumber(
              item.REFERENCE_PERCENT,
              'REFERENCE_PERCENT',
              0,
              100
            ),
      REFERENCE_AMOUNT:
        item.REFERENCE_AMOUNT === undefined || item.REFERENCE_AMOUNT === null
          ? null
          : this.normalizeNonNegativeNumber(
              item.REFERENCE_AMOUNT,
              'REFERENCE_AMOUNT'
            ),
      NOTES: this.normalizeNullableText(item.NOTES),
    }))
  }

  private normalizeRequiredText(value?: string | null, field = 'CAMPO'): string {
    const normalized = `${value || ''}`.trim()
    if (!normalized) {
      throw new BadRequestError(`El campo ${field} es requerido.`)
    }
    return normalized
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = `${value || ''}`.trim()
    return normalized || null
  }

  private normalizePositiveNumber(
    value: number | undefined,
    field: string,
    fallback?: number
  ): number {
    if (value === undefined || value === null) {
      if (fallback !== undefined) return fallback
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
    field: string,
    fallback?: number
  ): number {
    if (value === undefined || value === null) {
      if (fallback !== undefined) return fallback
      throw new BadRequestError(`El campo ${field} es requerido.`)
    }

    const normalized = Number(value)
    if (!Number.isFinite(normalized) || normalized < 0) {
      throw new BadRequestError(`El campo ${field} debe ser mayor o igual a cero.`)
    }

    return Number(normalized.toFixed(2))
  }

  private normalizeBoundedNumber(
    value: number,
    field: string,
    min: number,
    max: number
  ): number {
    const normalized = Number(value)

    if (!Number.isFinite(normalized) || normalized < min || normalized > max) {
      throw new BadRequestError(
        `El campo ${field} debe estar entre ${min} y ${max}.`
      )
    }

    return Number(normalized.toFixed(2))
  }

  private normalizeDate(value?: Date | string | null): Date | null {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('La fecha indicada no tiene un formato valido.')
    }
    return date
  }

  private buildOrderNo(workOrderId: number): string {
    return `OT-${String(workOrderId).padStart(6, '0')}`
  }

  private isFinalStatus(code = ''): boolean {
    return ['ENTREGADA', 'CANCELADA'].includes(code)
  }

  private getPersonName(person?: Person | null): string {
    return `${person?.NAME || ''} ${person?.LAST_NAME || ''}`
      .trim()
      .replace(/\s+/g, ' ')
  }

  private getStaffName(staff?: Staff | null): string {
    if (!staff) return ''
    return this.getPersonName(staff.PERSON)
  }

  private getVehicleLabel(vehicle?: Vehicle | null): string {
    if (!vehicle) return ''
    return [vehicle.PLATE, vehicle.BRAND, vehicle.MODEL]
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  private toNumber(value: unknown): number {
    const normalized = Number(value)
    if (!Number.isFinite(normalized)) {
      return 0
    }
    return Number(normalized.toFixed(2))
  }

  private toBoolean(value: unknown): boolean {
    return value === true || value === 'true' || value === 'TRUE' || value === 1
  }
}
