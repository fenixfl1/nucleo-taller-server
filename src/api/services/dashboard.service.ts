import { Staff } from '@entity/Staff'
import { queryRunner } from '@src/helpers/query-utils'
import { ApiResponse, SessionInfo } from '@src/types/api.types'
import { NotFoundError } from '@api/errors/http.error'
import { BaseService, CatchServiceError } from './base.service'

type DashboardSummaryRow = {
  ACTIVE_CUSTOMERS: number | string | null
  ACTIVE_VEHICLES: number | string | null
  ACTIVE_SERVICE_VEHICLES: number | string | null
  ACTIVE_ARTICLES: number | string | null
  ACTIVE_WORK_ORDERS: number | string | null
  READY_FOR_DELIVERY: number | string | null
  TOTAL_DELIVERIES: number | string | null
  AVAILABLE_SERVICE_VEHICLES: number | string | null
  PENDING_SERVICE_VEHICLE_MAINTENANCE: number | string | null
  OVERDUE_SERVICE_VEHICLE_MAINTENANCE: number | string | null
  TOTAL_SERVICE_VEHICLE_USAGE_HOURS: number | string | null
  TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS: number | string | null
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

type DashboardServiceVehicleRow = {
  SERVICE_VEHICLE_ID: number | string
  NAME: string | null
  PLATE: string | null
  BRAND: string | null
  MODEL: string | null
  STATE: string | null
  CREATED_AT: Date | string | null
}

type DashboardServiceVehicleMaintenanceRow = {
  SERVICE_VEHICLE_ID: number | string
  VEHICLE_NAME: string | null
  PLATE: string | null
  PENDING_TOTAL: number | string | null
  OVERDUE_TOTAL: number | string | null
  NEXT_SCHEDULED_AT: Date | string | null
}

type DashboardServiceVehicleUsageRow = {
  SERVICE_VEHICLE_ID: number | string
  VEHICLE_NAME: string | null
  PLATE: string | null
  TOTAL_USAGES: number | string | null
  TOTAL_HOURS: number | string | null
  TOTAL_KILOMETERS: number | string | null
  LAST_USAGE_AT: Date | string | null
}

type DashboardServiceVehicleAvailabilityRow = {
  SERVICE_VEHICLE_ID: number | string
  VEHICLE_NAME: string | null
  PLATE: string | null
  BRAND: string | null
  MODEL: string | null
  AVAILABILITY_STATUS: string | null
  CURRENT_USAGE_COUNT: number | string | null
  OPEN_MAINTENANCE_COUNT: number | string | null
}

export type WorkshopDashboardSnapshotResponse = {
  summary: {
    activeCustomers: number
    activeVehicles: number
    activeServiceVehicles: number
    activeArticles: number
    activeWorkOrders: number
    readyForDelivery: number
    totalDeliveries: number
    availableServiceVehicles: number
    pendingServiceVehicleMaintenance: number
    overdueServiceVehicleMaintenance: number
    totalServiceVehicleUsageHours: number
    totalServiceVehicleUsageKilometers: number
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
  recentServiceVehicles: Array<{
    SERVICE_VEHICLE_ID: number
    NAME: string
    PLATE: string
    BRAND: string
    MODEL: string
    STATE: string
    CREATED_AT: Date | string | null
  }>
  fleetMaintenanceAlerts: Array<{
    SERVICE_VEHICLE_ID: number
    VEHICLE_NAME: string
    PLATE: string
    PENDING_TOTAL: number
    OVERDUE_TOTAL: number
    NEXT_SCHEDULED_AT: Date | string | null
  }>
  fleetUsageSummary: Array<{
    SERVICE_VEHICLE_ID: number
    VEHICLE_NAME: string
    PLATE: string
    TOTAL_USAGES: number
    TOTAL_HOURS: number
    TOTAL_KILOMETERS: number
    LAST_USAGE_AT: Date | string | null
  }>
  fleetAvailability: Array<{
    SERVICE_VEHICLE_ID: number
    VEHICLE_NAME: string
    PLATE: string
    BRAND: string
    MODEL: string
    AVAILABILITY_STATUS: string
    CURRENT_USAGE_COUNT: number
    OPEN_MAINTENANCE_COUNT: number
  }>
}

export class DashboardService extends BaseService {
  @CatchServiceError()
  async getWorkshopSnapshot(
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<WorkshopDashboardSnapshotResponse>> {
    const businessId = await this.resolveBusinessId(sessionInfo.userId)

    const [
      summaryRows,
      inProgressOrders,
      readyForDeliveryOrders,
      recentMovements,
      recentDeliveries,
      recentServiceVehicles,
      fleetMaintenanceAlerts,
      fleetUsageSummary,
      fleetAvailability,
    ] =
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
                FROM "SERVICE_VEHICLE" AS "sv"
                WHERE "sv"."BUSINESS_ID" = $1
                  AND "sv"."STATE" = 'A'
              ) AS "ACTIVE_SERVICE_VEHICLES",
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
              ) AS "TOTAL_DELIVERIES",
              (
                WITH "usage_open" AS (
                  SELECT
                    "SERVICE_VEHICLE_ID",
                    COUNT(*) AS "CURRENT_USAGE_COUNT"
                  FROM "SERVICE_VEHICLE_USAGE"
                  WHERE "STATE" = 'A'
                    AND "STATUS" = 'EN_CURSO'
                  GROUP BY "SERVICE_VEHICLE_ID"
                ),
                "maintenance_open" AS (
                  SELECT
                    "SERVICE_VEHICLE_ID",
                    COUNT(*) FILTER (
                      WHERE "STATUS" IN ('PENDIENTE', 'EN_PROCESO')
                    ) AS "OPEN_MAINTENANCE_COUNT",
                    COUNT(*) FILTER (
                      WHERE "STATUS" = 'EN_PROCESO'
                    ) AS "IN_PROGRESS_MAINTENANCE_COUNT"
                  FROM "SERVICE_VEHICLE_MAINTENANCE"
                  WHERE "STATE" = 'A'
                  GROUP BY "SERVICE_VEHICLE_ID"
                )
                SELECT COUNT(*) FILTER (
                  WHERE
                    "sv"."STATE" = 'A'
                    AND COALESCE("u"."CURRENT_USAGE_COUNT", 0) = 0
                    AND COALESCE("m"."IN_PROGRESS_MAINTENANCE_COUNT", 0) = 0
                )
                FROM "SERVICE_VEHICLE" AS "sv"
                LEFT JOIN "usage_open" AS "u"
                  ON "u"."SERVICE_VEHICLE_ID" = "sv"."SERVICE_VEHICLE_ID"
                LEFT JOIN "maintenance_open" AS "m"
                  ON "m"."SERVICE_VEHICLE_ID" = "sv"."SERVICE_VEHICLE_ID"
                WHERE "sv"."BUSINESS_ID" = $1
              ) AS "AVAILABLE_SERVICE_VEHICLES",
              (
                SELECT COUNT(*)
                FROM "SERVICE_VEHICLE_MAINTENANCE" AS "m"
                WHERE "m"."BUSINESS_ID" = $1
                  AND "m"."STATE" = 'A'
                  AND "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
              ) AS "PENDING_SERVICE_VEHICLE_MAINTENANCE",
              (
                SELECT COUNT(*)
                FROM "SERVICE_VEHICLE_MAINTENANCE" AS "m"
                WHERE "m"."BUSINESS_ID" = $1
                  AND "m"."STATE" = 'A'
                  AND "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
                  AND "m"."SCHEDULED_AT" IS NOT NULL
                  AND "m"."SCHEDULED_AT" < now()
              ) AS "OVERDUE_SERVICE_VEHICLE_MAINTENANCE",
              (
                SELECT ROUND(
                  COALESCE(
                    SUM(
                      CASE
                        WHEN "u"."STATUS" = 'FINALIZADA'
                          AND "u"."ENDED_AT" IS NOT NULL
                        THEN EXTRACT(EPOCH FROM ("u"."ENDED_AT" - "u"."STARTED_AT")) / 3600
                        ELSE 0
                      END
                    ),
                    0
                  )::numeric,
                  2
                )
                FROM "SERVICE_VEHICLE_USAGE" AS "u"
                WHERE "u"."BUSINESS_ID" = $1
                  AND "u"."STATE" = 'A'
                  AND "u"."STATUS" = 'FINALIZADA'
              ) AS "TOTAL_SERVICE_VEHICLE_USAGE_HOURS",
              (
                SELECT ROUND(
                  COALESCE(
                    SUM(
                      CASE
                        WHEN "u"."STATUS" = 'FINALIZADA'
                          AND "u"."ODOMETER_START" IS NOT NULL
                          AND "u"."ODOMETER_END" IS NOT NULL
                          AND "u"."ODOMETER_END" >= "u"."ODOMETER_START"
                        THEN "u"."ODOMETER_END" - "u"."ODOMETER_START"
                        ELSE 0
                      END
                    ),
                    0
                  )::numeric,
                  2
                )
                FROM "SERVICE_VEHICLE_USAGE" AS "u"
                WHERE "u"."BUSINESS_ID" = $1
                  AND "u"."STATE" = 'A'
                  AND "u"."STATUS" = 'FINALIZADA'
              ) AS "TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS"
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
        queryRunner<DashboardServiceVehicleRow>(
          `
            SELECT
              "sv"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
              COALESCE("sv"."NAME", '') AS "NAME",
              COALESCE("sv"."PLATE", '') AS "PLATE",
              COALESCE("sv"."BRAND", '') AS "BRAND",
              COALESCE("sv"."MODEL", '') AS "MODEL",
              COALESCE("sv"."STATE", '') AS "STATE",
              "sv"."CREATED_AT" AS "CREATED_AT"
            FROM "SERVICE_VEHICLE" AS "sv"
            WHERE "sv"."BUSINESS_ID" = $1
            ORDER BY "sv"."CREATED_AT" DESC, "sv"."SERVICE_VEHICLE_ID" DESC
            LIMIT 5
          `,
          [businessId]
        ),
        queryRunner<DashboardServiceVehicleMaintenanceRow>(
          `
            SELECT
              "sv"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
              COALESCE("sv"."NAME", '') AS "VEHICLE_NAME",
              COALESCE("sv"."PLATE", '') AS "PLATE",
              COUNT(*) FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
              ) AS "PENDING_TOTAL",
              COUNT(*) FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
                  AND "m"."SCHEDULED_AT" IS NOT NULL
                  AND "m"."SCHEDULED_AT" < now()
              ) AS "OVERDUE_TOTAL",
              MIN("m"."SCHEDULED_AT") FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
              ) AS "NEXT_SCHEDULED_AT"
            FROM "SERVICE_VEHICLE" AS "sv"
            LEFT JOIN "SERVICE_VEHICLE_MAINTENANCE" AS "m"
              ON "m"."SERVICE_VEHICLE_ID" = "sv"."SERVICE_VEHICLE_ID"
             AND "m"."STATE" = 'A'
            WHERE "sv"."BUSINESS_ID" = $1
            GROUP BY "sv"."SERVICE_VEHICLE_ID", "sv"."NAME", "sv"."PLATE"
            HAVING COUNT(*) FILTER (
              WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
            ) > 0
            ORDER BY
              COUNT(*) FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
                  AND "m"."SCHEDULED_AT" IS NOT NULL
                  AND "m"."SCHEDULED_AT" < now()
              ) DESC,
              COUNT(*) FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
              ) DESC,
              MIN("m"."SCHEDULED_AT") FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
              ) ASC NULLS LAST,
              "sv"."NAME" ASC
            LIMIT 5
          `,
          [businessId]
        ),
        queryRunner<DashboardServiceVehicleUsageRow>(
          `
            SELECT
              "sv"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
              COALESCE("sv"."NAME", '') AS "VEHICLE_NAME",
              COALESCE("sv"."PLATE", '') AS "PLATE",
              COUNT(*) AS "TOTAL_USAGES",
              ROUND(
                COALESCE(
                  SUM(
                    CASE
                      WHEN "u"."ENDED_AT" IS NOT NULL
                      THEN EXTRACT(EPOCH FROM ("u"."ENDED_AT" - "u"."STARTED_AT")) / 3600
                      ELSE 0
                    END
                  ),
                  0
                )::numeric,
                2
              ) AS "TOTAL_HOURS",
              ROUND(
                COALESCE(
                  SUM(
                    CASE
                      WHEN "u"."ODOMETER_START" IS NOT NULL
                        AND "u"."ODOMETER_END" IS NOT NULL
                        AND "u"."ODOMETER_END" >= "u"."ODOMETER_START"
                      THEN "u"."ODOMETER_END" - "u"."ODOMETER_START"
                      ELSE 0
                    END
                  ),
                  0
                )::numeric,
                2
              ) AS "TOTAL_KILOMETERS",
              MAX(COALESCE("u"."ENDED_AT", "u"."STARTED_AT")) AS "LAST_USAGE_AT"
            FROM "SERVICE_VEHICLE_USAGE" AS "u"
            INNER JOIN "SERVICE_VEHICLE" AS "sv"
              ON "sv"."SERVICE_VEHICLE_ID" = "u"."SERVICE_VEHICLE_ID"
            WHERE "u"."BUSINESS_ID" = $1
              AND "u"."STATE" = 'A'
              AND "u"."STATUS" = 'FINALIZADA'
            GROUP BY "sv"."SERVICE_VEHICLE_ID", "sv"."NAME", "sv"."PLATE"
            ORDER BY "TOTAL_KILOMETERS" DESC, "TOTAL_HOURS" DESC, "sv"."NAME" ASC
            LIMIT 5
          `,
          [businessId]
        ),
        queryRunner<DashboardServiceVehicleAvailabilityRow>(
          `
            WITH "usage_open" AS (
              SELECT
                "SERVICE_VEHICLE_ID",
                COUNT(*) AS "CURRENT_USAGE_COUNT"
              FROM "SERVICE_VEHICLE_USAGE"
              WHERE "STATE" = 'A'
                AND "STATUS" = 'EN_CURSO'
              GROUP BY "SERVICE_VEHICLE_ID"
            ),
            "maintenance_open" AS (
              SELECT
                "SERVICE_VEHICLE_ID",
                COUNT(*) FILTER (
                  WHERE "STATUS" IN ('PENDIENTE', 'EN_PROCESO')
                ) AS "OPEN_MAINTENANCE_COUNT",
                COUNT(*) FILTER (
                  WHERE "STATUS" = 'EN_PROCESO'
                ) AS "IN_PROGRESS_MAINTENANCE_COUNT"
              FROM "SERVICE_VEHICLE_MAINTENANCE"
              WHERE "STATE" = 'A'
              GROUP BY "SERVICE_VEHICLE_ID"
            )
            SELECT
              "sv"."SERVICE_VEHICLE_ID" AS "SERVICE_VEHICLE_ID",
              COALESCE("sv"."NAME", '') AS "VEHICLE_NAME",
              COALESCE("sv"."PLATE", '') AS "PLATE",
              COALESCE("sv"."BRAND", '') AS "BRAND",
              COALESCE("sv"."MODEL", '') AS "MODEL",
              CASE
                WHEN "sv"."STATE" <> 'A' THEN 'INACTIVO'
                WHEN COALESCE("u"."CURRENT_USAGE_COUNT", 0) > 0 THEN 'EN_USO'
                WHEN COALESCE("m"."IN_PROGRESS_MAINTENANCE_COUNT", 0) > 0 THEN 'EN_MANTENIMIENTO'
                WHEN COALESCE("m"."OPEN_MAINTENANCE_COUNT", 0) > 0 THEN 'DISPONIBLE_CON_PENDIENTE'
                ELSE 'DISPONIBLE'
              END AS "AVAILABILITY_STATUS",
              COALESCE("u"."CURRENT_USAGE_COUNT", 0) AS "CURRENT_USAGE_COUNT",
              COALESCE("m"."OPEN_MAINTENANCE_COUNT", 0) AS "OPEN_MAINTENANCE_COUNT"
            FROM "SERVICE_VEHICLE" AS "sv"
            LEFT JOIN "usage_open" AS "u"
              ON "u"."SERVICE_VEHICLE_ID" = "sv"."SERVICE_VEHICLE_ID"
            LEFT JOIN "maintenance_open" AS "m"
              ON "m"."SERVICE_VEHICLE_ID" = "sv"."SERVICE_VEHICLE_ID"
            WHERE "sv"."BUSINESS_ID" = $1
            ORDER BY
              CASE
                WHEN "sv"."STATE" <> 'A' THEN 5
                WHEN COALESCE("u"."CURRENT_USAGE_COUNT", 0) > 0 THEN 4
                WHEN COALESCE("m"."IN_PROGRESS_MAINTENANCE_COUNT", 0) > 0 THEN 3
                WHEN COALESCE("m"."OPEN_MAINTENANCE_COUNT", 0) > 0 THEN 2
                ELSE 1
              END ASC,
              "sv"."NAME" ASC
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
          activeServiceVehicles: this.toNumber(
            summary?.ACTIVE_SERVICE_VEHICLES
          ),
          activeArticles: this.toNumber(summary?.ACTIVE_ARTICLES),
          activeWorkOrders: this.toNumber(summary?.ACTIVE_WORK_ORDERS),
          readyForDelivery: this.toNumber(summary?.READY_FOR_DELIVERY),
          totalDeliveries: this.toNumber(summary?.TOTAL_DELIVERIES),
          availableServiceVehicles: this.toNumber(
            summary?.AVAILABLE_SERVICE_VEHICLES
          ),
          pendingServiceVehicleMaintenance: this.toNumber(
            summary?.PENDING_SERVICE_VEHICLE_MAINTENANCE
          ),
          overdueServiceVehicleMaintenance: this.toNumber(
            summary?.OVERDUE_SERVICE_VEHICLE_MAINTENANCE
          ),
          totalServiceVehicleUsageHours: this.toNumber(
            summary?.TOTAL_SERVICE_VEHICLE_USAGE_HOURS
          ),
          totalServiceVehicleUsageKilometers: this.toNumber(
            summary?.TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS
          ),
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
        recentServiceVehicles: recentServiceVehicles.map((item) => ({
          SERVICE_VEHICLE_ID: this.toNumber(item.SERVICE_VEHICLE_ID),
          NAME: item.NAME || '',
          PLATE: item.PLATE || '',
          BRAND: item.BRAND || '',
          MODEL: item.MODEL || '',
          STATE: item.STATE || '',
          CREATED_AT: item.CREATED_AT,
        })),
        fleetMaintenanceAlerts: fleetMaintenanceAlerts.map((item) => ({
          SERVICE_VEHICLE_ID: this.toNumber(item.SERVICE_VEHICLE_ID),
          VEHICLE_NAME: item.VEHICLE_NAME || '',
          PLATE: item.PLATE || '',
          PENDING_TOTAL: this.toNumber(item.PENDING_TOTAL),
          OVERDUE_TOTAL: this.toNumber(item.OVERDUE_TOTAL),
          NEXT_SCHEDULED_AT: item.NEXT_SCHEDULED_AT,
        })),
        fleetUsageSummary: fleetUsageSummary.map((item) => ({
          SERVICE_VEHICLE_ID: this.toNumber(item.SERVICE_VEHICLE_ID),
          VEHICLE_NAME: item.VEHICLE_NAME || '',
          PLATE: item.PLATE || '',
          TOTAL_USAGES: this.toNumber(item.TOTAL_USAGES),
          TOTAL_HOURS: this.toNumber(item.TOTAL_HOURS),
          TOTAL_KILOMETERS: this.toNumber(item.TOTAL_KILOMETERS),
          LAST_USAGE_AT: item.LAST_USAGE_AT,
        })),
        fleetAvailability: fleetAvailability.map((item) => ({
          SERVICE_VEHICLE_ID: this.toNumber(item.SERVICE_VEHICLE_ID),
          VEHICLE_NAME: item.VEHICLE_NAME || '',
          PLATE: item.PLATE || '',
          BRAND: item.BRAND || '',
          MODEL: item.MODEL || '',
          AVAILABILITY_STATUS: item.AVAILABILITY_STATUS || 'DISPONIBLE',
          CURRENT_USAGE_COUNT: this.toNumber(item.CURRENT_USAGE_COUNT),
          OPEN_MAINTENANCE_COUNT: this.toNumber(
            item.OPEN_MAINTENANCE_COUNT
          ),
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
