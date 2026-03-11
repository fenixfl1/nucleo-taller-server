import { Staff } from '@entity/Staff'
import { queryRunner } from '@src/helpers/query-utils'
import { ApiResponse, SessionInfo } from '@src/types/api.types'
import { NotFoundError } from '@api/errors/http.error'
import { BaseService, CatchServiceError } from './base.service'

type DashboardSummaryRow = {
  ACTIVE_CUSTOMERS: number | string | null
  ACTIVE_VEHICLES: number | string | null
  ACTIVE_ARTICLES: number | string | null
  ACTIVE_WORK_ORDERS: number | string | null
  READY_FOR_DELIVERY: number | string | null
  TOTAL_DELIVERIES: number | string | null
}

type DashboardWorkOrderRow = {
  WORK_ORDER_ID: number | string
  ORDER_NO: string | null
  CUSTOMER_NAME: string | null
  VEHICLE_LABEL: string | null
  STATUS_CODE: string | null
  STATUS_NAME: string | null
  OPENED_AT: Date | string | null
}

type DashboardMovementRow = {
  MOVEMENT_ID: number | string
  MOVEMENT_NO: string | null
  MOVEMENT_TYPE: string | null
  MOVEMENT_DATE: Date | string | null
  REFERENCE_SOURCE: string | null
  STATE: string | null
}

type DashboardDeliveryRow = {
  DELIVERY_RECEIPT_ID: number | string
  RECEIPT_NO: string | null
  WORK_ORDER_NO: string | null
  VEHICLE_LABEL: string | null
  DELIVERY_DATE: Date | string | null
}

export type WorkshopDashboardSnapshotResponse = {
  summary: {
    activeCustomers: number
    activeVehicles: number
    activeArticles: number
    activeWorkOrders: number
    readyForDelivery: number
    totalDeliveries: number
  }
  inProgressOrders: Array<{
    WORK_ORDER_ID: number
    ORDER_NO: string
    CUSTOMER_NAME: string
    VEHICLE_LABEL: string
    STATUS_CODE: string
    STATUS_NAME: string
    OPENED_AT: Date | string | null
  }>
  readyForDeliveryOrders: Array<{
    WORK_ORDER_ID: number
    ORDER_NO: string
    CUSTOMER_NAME: string
    VEHICLE_LABEL: string
    STATUS_CODE: string
    STATUS_NAME: string
    OPENED_AT: Date | string | null
  }>
  recentMovements: Array<{
    MOVEMENT_ID: number
    MOVEMENT_NO: string
    MOVEMENT_TYPE: string
    MOVEMENT_DATE: Date | string | null
    REFERENCE_SOURCE: string
    STATE: string
  }>
  recentDeliveries: Array<{
    DELIVERY_RECEIPT_ID: number
    RECEIPT_NO: string
    WORK_ORDER_NO: string
    VEHICLE_LABEL: string
    DELIVERY_DATE: Date | string | null
  }>
}

export class DashboardService extends BaseService {
  @CatchServiceError()
  async getWorkshopSnapshot(
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkshopDashboardSnapshotResponse>> {
    const businessId = await this.resolveBusinessId(sessionInfo.userId)

    const [summaryRows, inProgressOrders, readyForDeliveryOrders, recentMovements, recentDeliveries] =
      await Promise.all([
        queryRunner<DashboardSummaryRow>(
          `
            SELECT
              (
                SELECT COUNT(*)
                FROM "PERSON" AS "p"
                LEFT JOIN "STAFF" AS "s"
                  ON "s"."PERSON_ID" = "p"."PERSON_ID"
                WHERE "p"."BUSINESS_ID" = $1
                  AND "p"."STATE" = 'A'
                  AND "s"."STAFF_ID" IS NULL
              ) AS "ACTIVE_CUSTOMERS",
              (
                SELECT COUNT(*)
                FROM "VEHICLE" AS "v"
                WHERE "v"."BUSINESS_ID" = $1
                  AND "v"."STATE" = 'A'
              ) AS "ACTIVE_VEHICLES",
              (
                SELECT COUNT(*)
                FROM "ARTICLE" AS "a"
                WHERE "a"."BUSINESS_ID" = $1
                  AND "a"."STATE" = 'A'
              ) AS "ACTIVE_ARTICLES",
              (
                SELECT COUNT(*)
                FROM "WORK_ORDER" AS "wo"
                INNER JOIN "WORK_ORDER_STATUS" AS "ws"
                  ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
                WHERE "wo"."BUSINESS_ID" = $1
                  AND "wo"."STATE" = 'A'
                  AND "ws"."CODE" IN ('CREADA', 'DIAGNOSTICO', 'REPARACION', 'LISTA_ENTREGA')
              ) AS "ACTIVE_WORK_ORDERS",
              (
                SELECT COUNT(*)
                FROM "WORK_ORDER" AS "wo"
                INNER JOIN "WORK_ORDER_STATUS" AS "ws"
                  ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
                WHERE "wo"."BUSINESS_ID" = $1
                  AND "wo"."STATE" = 'A'
                  AND "ws"."CODE" = 'LISTA_ENTREGA'
              ) AS "READY_FOR_DELIVERY",
              (
                SELECT COUNT(*)
                FROM "DELIVERY_RECEIPT" AS "dr"
                WHERE "dr"."BUSINESS_ID" = $1
                  AND "dr"."STATE" = 'A'
              ) AS "TOTAL_DELIVERIES"
          `,
          [businessId]
        ),
        queryRunner<DashboardWorkOrderRow>(
          `
            SELECT
              "wo"."WORK_ORDER_ID" AS "WORK_ORDER_ID",
              COALESCE("wo"."ORDER_NO", '') AS "ORDER_NO",
              TRIM(CONCAT(COALESCE("c"."NAME", ''), ' ', COALESCE("c"."LAST_NAME", ''))) AS "CUSTOMER_NAME",
              TRIM(CONCAT(COALESCE("v"."PLATE", ''), ' ', COALESCE("v"."BRAND", ''), ' ', COALESCE("v"."MODEL", ''))) AS "VEHICLE_LABEL",
              COALESCE("ws"."CODE", '') AS "STATUS_CODE",
              COALESCE("ws"."NAME", '') AS "STATUS_NAME",
              "wo"."OPENED_AT" AS "OPENED_AT"
            FROM "WORK_ORDER" AS "wo"
            INNER JOIN "WORK_ORDER_STATUS" AS "ws"
              ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
            INNER JOIN "PERSON" AS "c"
              ON "c"."PERSON_ID" = "wo"."CUSTOMER_ID"
            INNER JOIN "VEHICLE" AS "v"
              ON "v"."VEHICLE_ID" = "wo"."VEHICLE_ID"
            WHERE "wo"."BUSINESS_ID" = $1
              AND "wo"."STATE" = 'A'
              AND "ws"."CODE" IN ('CREADA', 'DIAGNOSTICO', 'REPARACION')
            ORDER BY "wo"."OPENED_AT" DESC, "wo"."WORK_ORDER_ID" DESC
            LIMIT 5
          `,
          [businessId]
        ),
        queryRunner<DashboardWorkOrderRow>(
          `
            SELECT
              "wo"."WORK_ORDER_ID" AS "WORK_ORDER_ID",
              COALESCE("wo"."ORDER_NO", '') AS "ORDER_NO",
              TRIM(CONCAT(COALESCE("c"."NAME", ''), ' ', COALESCE("c"."LAST_NAME", ''))) AS "CUSTOMER_NAME",
              TRIM(CONCAT(COALESCE("v"."PLATE", ''), ' ', COALESCE("v"."BRAND", ''), ' ', COALESCE("v"."MODEL", ''))) AS "VEHICLE_LABEL",
              COALESCE("ws"."CODE", '') AS "STATUS_CODE",
              COALESCE("ws"."NAME", '') AS "STATUS_NAME",
              "wo"."OPENED_AT" AS "OPENED_AT"
            FROM "WORK_ORDER" AS "wo"
            INNER JOIN "WORK_ORDER_STATUS" AS "ws"
              ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
            INNER JOIN "PERSON" AS "c"
              ON "c"."PERSON_ID" = "wo"."CUSTOMER_ID"
            INNER JOIN "VEHICLE" AS "v"
              ON "v"."VEHICLE_ID" = "wo"."VEHICLE_ID"
            WHERE "wo"."BUSINESS_ID" = $1
              AND "wo"."STATE" = 'A'
              AND "ws"."CODE" = 'LISTA_ENTREGA'
            ORDER BY "wo"."OPENED_AT" DESC, "wo"."WORK_ORDER_ID" DESC
            LIMIT 5
          `,
          [businessId]
        ),
        queryRunner<DashboardMovementRow>(
          `
            SELECT
              "im"."MOVEMENT_ID" AS "MOVEMENT_ID",
              COALESCE("im"."MOVEMENT_NO", '') AS "MOVEMENT_NO",
              COALESCE("im"."MOVEMENT_TYPE", '') AS "MOVEMENT_TYPE",
              "im"."MOVEMENT_DATE" AS "MOVEMENT_DATE",
              COALESCE("im"."REFERENCE_SOURCE", '') AS "REFERENCE_SOURCE",
              COALESCE("im"."STATE", '') AS "STATE"
            FROM "INVENTORY_MOVEMENT" AS "im"
            WHERE "im"."BUSINESS_ID" = $1
              AND "im"."STATE" = 'A'
            ORDER BY "im"."MOVEMENT_DATE" DESC, "im"."MOVEMENT_ID" DESC
            LIMIT 5
          `,
          [businessId]
        ),
        queryRunner<DashboardDeliveryRow>(
          `
            SELECT
              "dr"."DELIVERY_RECEIPT_ID" AS "DELIVERY_RECEIPT_ID",
              COALESCE("dr"."RECEIPT_NO", '') AS "RECEIPT_NO",
              COALESCE("wo"."ORDER_NO", '') AS "WORK_ORDER_NO",
              TRIM(CONCAT(COALESCE("v"."PLATE", ''), ' ', COALESCE("v"."BRAND", ''), ' ', COALESCE("v"."MODEL", ''))) AS "VEHICLE_LABEL",
              "dr"."DELIVERY_DATE" AS "DELIVERY_DATE"
            FROM "DELIVERY_RECEIPT" AS "dr"
            INNER JOIN "WORK_ORDER" AS "wo"
              ON "wo"."WORK_ORDER_ID" = "dr"."WORK_ORDER_ID"
            INNER JOIN "VEHICLE" AS "v"
              ON "v"."VEHICLE_ID" = "wo"."VEHICLE_ID"
            WHERE "dr"."BUSINESS_ID" = $1
              AND "dr"."STATE" = 'A'
            ORDER BY "dr"."DELIVERY_DATE" DESC, "dr"."DELIVERY_RECEIPT_ID" DESC
            LIMIT 5
          `,
          [businessId]
        ),
      ])

    const summary = summaryRows[0]

    return this.success({
      data: {
        summary: {
          activeCustomers: this.toNumber(summary?.ACTIVE_CUSTOMERS),
          activeVehicles: this.toNumber(summary?.ACTIVE_VEHICLES),
          activeArticles: this.toNumber(summary?.ACTIVE_ARTICLES),
          activeWorkOrders: this.toNumber(summary?.ACTIVE_WORK_ORDERS),
          readyForDelivery: this.toNumber(summary?.READY_FOR_DELIVERY),
          totalDeliveries: this.toNumber(summary?.TOTAL_DELIVERIES),
        },
        inProgressOrders: inProgressOrders.map((item) => ({
          WORK_ORDER_ID: this.toNumber(item.WORK_ORDER_ID),
          ORDER_NO: item.ORDER_NO || '',
          CUSTOMER_NAME: item.CUSTOMER_NAME || '',
          VEHICLE_LABEL: item.VEHICLE_LABEL || '',
          STATUS_CODE: item.STATUS_CODE || '',
          STATUS_NAME: item.STATUS_NAME || '',
          OPENED_AT: item.OPENED_AT,
        })),
        readyForDeliveryOrders: readyForDeliveryOrders.map((item) => ({
          WORK_ORDER_ID: this.toNumber(item.WORK_ORDER_ID),
          ORDER_NO: item.ORDER_NO || '',
          CUSTOMER_NAME: item.CUSTOMER_NAME || '',
          VEHICLE_LABEL: item.VEHICLE_LABEL || '',
          STATUS_CODE: item.STATUS_CODE || '',
          STATUS_NAME: item.STATUS_NAME || '',
          OPENED_AT: item.OPENED_AT,
        })),
        recentMovements: recentMovements.map((item) => ({
          MOVEMENT_ID: this.toNumber(item.MOVEMENT_ID),
          MOVEMENT_NO: item.MOVEMENT_NO || '',
          MOVEMENT_TYPE: item.MOVEMENT_TYPE || '',
          MOVEMENT_DATE: item.MOVEMENT_DATE,
          REFERENCE_SOURCE: item.REFERENCE_SOURCE || '',
          STATE: item.STATE || '',
        })),
        recentDeliveries: recentDeliveries.map((item) => ({
          DELIVERY_RECEIPT_ID: this.toNumber(item.DELIVERY_RECEIPT_ID),
          RECEIPT_NO: item.RECEIPT_NO || '',
          WORK_ORDER_NO: item.WORK_ORDER_NO || '',
          VEHICLE_LABEL: item.VEHICLE_LABEL || '',
          DELIVERY_DATE: item.DELIVERY_DATE,
        })),
      },
    })
  }

  private async resolveBusinessId(userId: number): Promise<number> {
    const staff = await this.staffRepository.findOne({
      where: {
        STAFF_ID: userId,
        STATE: 'A' as never,
      },
    })

    if (!staff?.BUSINESS_ID) {
      throw new NotFoundError('No se pudo resolver la empresa del usuario actual.')
    }

    return Number(staff.BUSINESS_ID)
  }

  private toNumber(value: unknown): number {
    if (value == null || value === '') return 0
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }
}
