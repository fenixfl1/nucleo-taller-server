import { queryRunner } from '@src/helpers/query-utils'
import { ApiResponse } from '@src/types/api.types'
import { BaseService, CatchServiceError } from './base.service'

type ReportPayload = {
  START_DATE?: string | null
  END_DATE?: string | null
  EMPLOYEE_TYPE?: 'OPERACIONAL' | 'ADMINISTRATIVO' | null
  STAFF_ID?: number | string | null
}

type SummaryRow = {
  OPENED_WORK_ORDERS: number | string | null
  DELIVERED_WORK_ORDERS: number | string | null
  CANCELLED_WORK_ORDERS: number | string | null
  DELIVERY_RECEIPTS: number | string | null
  INVENTORY_CONSUMPTION_QUANTITY: number | string | null
  ARTICLES_BELOW_MINIMUM: number | string | null
  AVERAGE_CLOSURE_DAYS: number | string | null
  ACTIVE_SERVICE_VEHICLES: number | string | null
  SERVICE_VEHICLE_HISTORY_EVENTS: number | string | null
  PENDING_SERVICE_VEHICLE_MAINTENANCE: number | string | null
  OVERDUE_SERVICE_VEHICLE_MAINTENANCE: number | string | null
  AVAILABLE_SERVICE_VEHICLES: number | string | null
  TOTAL_SERVICE_VEHICLE_USAGE_HOURS: number | string | null
  TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS: number | string | null
}

type WorkOrdersByStatusRow = {
  STATUS_CODE: string | null
  STATUS_NAME: string | null
  TOTAL: number | string | null
}

type TopConsumedArticleRow = {
  ARTICLE_ID: number | string | null
  ARTICLE_CODE: string | null
  ARTICLE_NAME: string | null
  TOTAL_QUANTITY: number | string | null
  MOVEMENT_COUNT: number | string | null
  TOTAL_ESTIMATED_COST: number | string | null
}

type LowStockArticleRow = {
  ARTICLE_ID: number | string | null
  CODE: string | null
  NAME: string | null
  ITEM_TYPE: string | null
  CURRENT_STOCK: number | string | null
  MIN_STOCK: number | string | null
  DEFICIT: number | string | null
  COST_REFERENCE: number | string | null
}

type TopTechnicianRow = {
  STAFF_ID: number | string | null
  USERNAME: string | null
  FULL_NAME: string | null
  TOTAL_ASSIGNED_ORDERS: number | string | null
  LEAD_ORDERS: number | string | null
  DELIVERED_ORDERS: number | string | null
  TOTAL_SERVICE_LINES: number | string | null
  TOTAL_REFERENCE_AMOUNT: number | string | null
}

type ServiceVehiclesByStateRow = {
  STATE: string | null
  TOTAL: number | string | null
}

type ServiceVehicleFleetRow = {
  BRAND: string | null
  MODEL: string | null
  TOTAL: number | string | null
}

type ServiceVehicleHistoryRow = {
  ID: number | string | null
  ACTION: string | null
  VEHICLE_NAME: string | null
  PLATE: string | null
  ACTOR_NAME: string | null
  USERNAME: string | null
  EMPLOYEE_TYPE: string | null
  CREATED_AT: Date | string | null
}

type ServiceVehicleMaintenanceByVehicleRow = {
  SERVICE_VEHICLE_ID: number | string | null
  VEHICLE_NAME: string | null
  PLATE: string | null
  PENDING_TOTAL: number | string | null
  OVERDUE_TOTAL: number | string | null
  NEXT_SCHEDULED_AT: Date | string | null
}

type ServiceVehicleUsageByVehicleRow = {
  SERVICE_VEHICLE_ID: number | string | null
  VEHICLE_NAME: string | null
  PLATE: string | null
  TOTAL_USAGES: number | string | null
  TOTAL_HOURS: number | string | null
  TOTAL_KILOMETERS: number | string | null
  LAST_USAGE_AT: Date | string | null
}

type ServiceVehicleAvailabilityRow = {
  SERVICE_VEHICLE_ID: number | string | null
  VEHICLE_NAME: string | null
  PLATE: string | null
  BRAND: string | null
  MODEL: string | null
  AVAILABILITY_STATUS: string | null
  CURRENT_USAGE_COUNT: number | string | null
  OPEN_MAINTENANCE_COUNT: number | string | null
  IN_PROGRESS_MAINTENANCE_COUNT: number | string | null
}

export type OperationalReportSummary = {
  OPENED_WORK_ORDERS: number
  DELIVERED_WORK_ORDERS: number
  CANCELLED_WORK_ORDERS: number
  DELIVERY_RECEIPTS: number
  INVENTORY_CONSUMPTION_QUANTITY: number
  ARTICLES_BELOW_MINIMUM: number
  AVERAGE_CLOSURE_DAYS: number
  ACTIVE_SERVICE_VEHICLES: number
  SERVICE_VEHICLE_HISTORY_EVENTS: number
  PENDING_SERVICE_VEHICLE_MAINTENANCE: number
  OVERDUE_SERVICE_VEHICLE_MAINTENANCE: number
  AVAILABLE_SERVICE_VEHICLES: number
  TOTAL_SERVICE_VEHICLE_USAGE_HOURS: number
  TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS: number
}

export type WorkOrdersByStatusReportItem = {
  STATUS_CODE: string
  STATUS_NAME: string
  TOTAL: number
}

export type TopConsumedArticleReportItem = {
  ARTICLE_ID: number
  ARTICLE_CODE: string
  ARTICLE_NAME: string
  TOTAL_QUANTITY: number
  MOVEMENT_COUNT: number
  TOTAL_ESTIMATED_COST: number
}

export type LowStockArticleReportItem = {
  ARTICLE_ID: number
  CODE: string
  NAME: string
  ITEM_TYPE: string
  CURRENT_STOCK: number
  MIN_STOCK: number
  DEFICIT: number
  COST_REFERENCE: number | null
}

export type TopTechnicianReportItem = {
  STAFF_ID: number
  USERNAME: string
  FULL_NAME: string
  TOTAL_ASSIGNED_ORDERS: number
  LEAD_ORDERS: number
  DELIVERED_ORDERS: number
  TOTAL_SERVICE_LINES: number
  TOTAL_REFERENCE_AMOUNT: number
}

export type ServiceVehiclesByStateReportItem = {
  STATE: string
  TOTAL: number
}

export type ServiceVehicleFleetReportItem = {
  BRAND: string
  MODEL: string
  TOTAL: number
}

export type ServiceVehicleHistoryReportItem = {
  ID: number
  ACTION: string
  VEHICLE_NAME: string
  PLATE: string
  ACTOR_NAME: string
  USERNAME: string
  EMPLOYEE_TYPE: string
  CREATED_AT: Date | string | null
}

export type ServiceVehicleMaintenanceByVehicleReportItem = {
  SERVICE_VEHICLE_ID: number
  VEHICLE_NAME: string
  PLATE: string
  PENDING_TOTAL: number
  OVERDUE_TOTAL: number
  NEXT_SCHEDULED_AT: Date | string | null
}

export type ServiceVehicleUsageByVehicleReportItem = {
  SERVICE_VEHICLE_ID: number
  VEHICLE_NAME: string
  PLATE: string
  TOTAL_USAGES: number
  TOTAL_HOURS: number
  TOTAL_KILOMETERS: number
  LAST_USAGE_AT: Date | string | null
}

export type ServiceVehicleAvailabilityReportItem = {
  SERVICE_VEHICLE_ID: number
  VEHICLE_NAME: string
  PLATE: string
  BRAND: string
  MODEL: string
  AVAILABILITY_STATUS: string
  CURRENT_USAGE_COUNT: number
  OPEN_MAINTENANCE_COUNT: number
  IN_PROGRESS_MAINTENANCE_COUNT: number
}

export type OperationalReportResponse = {
  FILTERS: {
    START_DATE: string | null
    END_DATE: string | null
    EMPLOYEE_TYPE: 'OPERACIONAL' | 'ADMINISTRATIVO' | null
    STAFF_ID: number | null
    STAFF_LABEL: string | null
  }
  SUMMARY: OperationalReportSummary
  WORK_ORDERS_BY_STATUS: WorkOrdersByStatusReportItem[]
  TOP_CONSUMED_ARTICLES: TopConsumedArticleReportItem[]
  LOW_STOCK_ARTICLES: LowStockArticleReportItem[]
  TOP_TECHNICIANS: TopTechnicianReportItem[]
  SERVICE_VEHICLES_BY_STATE: ServiceVehiclesByStateReportItem[]
  SERVICE_VEHICLE_FLEET: ServiceVehicleFleetReportItem[]
  SERVICE_VEHICLE_HISTORY: ServiceVehicleHistoryReportItem[]
  SERVICE_VEHICLE_MAINTENANCE_BY_VEHICLE: ServiceVehicleMaintenanceByVehicleReportItem[]
  SERVICE_VEHICLE_USAGE_BY_VEHICLE: ServiceVehicleUsageByVehicleReportItem[]
  SERVICE_VEHICLE_AVAILABILITY: ServiceVehicleAvailabilityReportItem[]
}

export class ReportService extends BaseService {
  @CatchServiceError()
  async getOperationalReport(
    payload: ReportPayload
  ): Promise<ApiResponse<OperationalReportResponse>> {
    const businessId = Number(
      (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    )
    const normalizedPayload = this.normalizePayload(payload)
    const values = [
      businessId,
      normalizedPayload.START_DATE,
      normalizedPayload.END_DATE,
      normalizedPayload.EMPLOYEE_TYPE,
      normalizedPayload.STAFF_ID,
    ]

    const [
      summary,
      workOrdersByStatus,
      topConsumedArticles,
      lowStockArticles,
      topTechnicians,
      serviceVehiclesByState,
      serviceVehicleFleet,
      serviceVehicleHistory,
      serviceVehicleMaintenanceByVehicle,
      serviceVehicleUsageByVehicle,
      serviceVehicleAvailability,
      staffLabel,
    ] = await Promise.all([
      this.getSummary(values),
      this.getWorkOrdersByStatus(values),
      this.getTopConsumedArticles(values),
      this.getLowStockArticles([businessId]),
      this.getTopTechnicians(values),
      this.getServiceVehiclesByState([businessId]),
      this.getServiceVehicleFleet([businessId]),
      this.getServiceVehicleHistory(values),
      this.getServiceVehicleMaintenanceByVehicle([businessId]),
      this.getServiceVehicleUsageByVehicle(values),
      this.getServiceVehicleAvailability([businessId]),
      this.resolveStaffLabel(businessId, normalizedPayload.STAFF_ID),
    ])

    return this.success({
      data: {
        FILTERS: {
          ...normalizedPayload,
          STAFF_LABEL: staffLabel,
        },
        SUMMARY: summary,
        WORK_ORDERS_BY_STATUS: workOrdersByStatus,
        TOP_CONSUMED_ARTICLES: topConsumedArticles,
        LOW_STOCK_ARTICLES: lowStockArticles,
        TOP_TECHNICIANS: topTechnicians,
        SERVICE_VEHICLES_BY_STATE: serviceVehiclesByState,
        SERVICE_VEHICLE_FLEET: serviceVehicleFleet,
        SERVICE_VEHICLE_HISTORY: serviceVehicleHistory,
        SERVICE_VEHICLE_MAINTENANCE_BY_VEHICLE: serviceVehicleMaintenanceByVehicle,
        SERVICE_VEHICLE_USAGE_BY_VEHICLE: serviceVehicleUsageByVehicle,
        SERVICE_VEHICLE_AVAILABILITY: serviceVehicleAvailability,
      },
    })
  }

  private normalizePayload(payload: ReportPayload): {
    START_DATE: string | null
    END_DATE: string | null
    EMPLOYEE_TYPE: 'OPERACIONAL' | 'ADMINISTRATIVO' | null
    STAFF_ID: number | null
  } {
    const startDate = payload.START_DATE?.trim?.() || null
    const endDate = payload.END_DATE?.trim?.() || null
    const employeeType =
      payload.EMPLOYEE_TYPE === 'ADMINISTRATIVO' ||
      payload.EMPLOYEE_TYPE === 'OPERACIONAL'
        ? payload.EMPLOYEE_TYPE
        : null
    const staffId = payload.STAFF_ID ? Number(payload.STAFF_ID) : null

    return {
      START_DATE: startDate,
      END_DATE: endDate,
      EMPLOYEE_TYPE: employeeType,
      STAFF_ID: Number.isFinite(staffId) && staffId ? staffId : null,
    }
  }

  private getWorkOrderEmployeeTypeClause(workOrderAlias: string): string {
    return `
      AND (
        ($4::varchar IS NULL AND $5::integer IS NULL)
        OR EXISTS (
          SELECT 1
          FROM "WORK_ORDER_TECHNICIAN" AS "wot_filter"
          INNER JOIN "STAFF" AS "s_filter"
            ON "s_filter"."STAFF_ID" = "wot_filter"."STAFF_ID"
          WHERE "wot_filter"."WORK_ORDER_ID" = "${workOrderAlias}"."WORK_ORDER_ID"
            AND "wot_filter"."STATE" = 'A'
            AND "s_filter"."STATE" = 'A'
            AND ($4::varchar IS NULL OR "s_filter"."EMPLOYEE_TYPE" = $4::varchar)
            AND ($5::integer IS NULL OR "s_filter"."STAFF_ID" = $5::integer)
        )
      )
    `
  }

  private toNumber(value: unknown): number {
    if (value == null || value === '') return 0
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }

  private async getSummary(values: unknown[]): Promise<OperationalReportSummary> {
    const [
      openedRow,
      deliveredRow,
      cancelledRow,
      receiptRow,
      consumptionRow,
      belowMinRow,
      serviceVehiclesRow,
      serviceVehicleHistoryRow,
      serviceVehicleMaintenanceRow,
      serviceVehicleAvailabilityRow,
      serviceVehicleUsageTotalsRow,
    ] =
      await Promise.all([
        queryRunner<Pick<SummaryRow, 'OPENED_WORK_ORDERS'>>(
          `
            SELECT COUNT(*) AS "OPENED_WORK_ORDERS"
            FROM "WORK_ORDER" AS "wo"
            WHERE "wo"."BUSINESS_ID" = $1
              AND "wo"."STATE" = 'A'
              AND ($2::date IS NULL OR "wo"."OPENED_AT"::date >= $2::date)
              AND ($3::date IS NULL OR "wo"."OPENED_AT"::date <= $3::date)
              ${this.getWorkOrderEmployeeTypeClause('wo')}
          `,
          values
        ),
        queryRunner<
          Pick<SummaryRow, 'DELIVERED_WORK_ORDERS' | 'AVERAGE_CLOSURE_DAYS'>
        >(
          `
            SELECT
              COUNT(*) AS "DELIVERED_WORK_ORDERS",
              ROUND(
                COALESCE(
                  AVG(EXTRACT(EPOCH FROM ("wo"."CLOSED_AT" - "wo"."OPENED_AT")) / 86400),
                  0
                )::numeric,
                2
              ) AS "AVERAGE_CLOSURE_DAYS"
            FROM "WORK_ORDER" AS "wo"
            INNER JOIN "WORK_ORDER_STATUS" AS "ws"
              ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
            WHERE "wo"."BUSINESS_ID" = $1
              AND "wo"."STATE" = 'A'
              AND "ws"."CODE" = 'ENTREGADA'
              AND "wo"."CLOSED_AT" IS NOT NULL
              AND ($2::date IS NULL OR "wo"."CLOSED_AT"::date >= $2::date)
              AND ($3::date IS NULL OR "wo"."CLOSED_AT"::date <= $3::date)
              ${this.getWorkOrderEmployeeTypeClause('wo')}
          `,
          values
        ),
        queryRunner<Pick<SummaryRow, 'CANCELLED_WORK_ORDERS'>>(
          `
            SELECT COUNT(*) AS "CANCELLED_WORK_ORDERS"
            FROM "WORK_ORDER" AS "wo"
            INNER JOIN "WORK_ORDER_STATUS" AS "ws"
              ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
            WHERE "wo"."BUSINESS_ID" = $1
              AND "wo"."STATE" = 'A'
              AND "ws"."CODE" = 'CANCELADA'
              AND "wo"."CANCELLED_AT" IS NOT NULL
              AND ($2::date IS NULL OR "wo"."CANCELLED_AT"::date >= $2::date)
              AND ($3::date IS NULL OR "wo"."CANCELLED_AT"::date <= $3::date)
              ${this.getWorkOrderEmployeeTypeClause('wo')}
          `,
          values
        ),
        queryRunner<Pick<SummaryRow, 'DELIVERY_RECEIPTS'>>(
          `
            SELECT COUNT(*) AS "DELIVERY_RECEIPTS"
            FROM "DELIVERY_RECEIPT" AS "dr"
            INNER JOIN "WORK_ORDER" AS "wo"
              ON "wo"."WORK_ORDER_ID" = "dr"."WORK_ORDER_ID"
            WHERE "dr"."BUSINESS_ID" = $1
              AND "dr"."STATE" = 'A'
              AND ($2::date IS NULL OR "dr"."DELIVERY_DATE"::date >= $2::date)
              AND ($3::date IS NULL OR "dr"."DELIVERY_DATE"::date <= $3::date)
              ${this.getWorkOrderEmployeeTypeClause('wo')}
          `,
          values
        ),
        queryRunner<Pick<SummaryRow, 'INVENTORY_CONSUMPTION_QUANTITY'>>(
          `
            SELECT
              ROUND(COALESCE(SUM("imd"."QUANTITY"), 0)::numeric, 2) AS "INVENTORY_CONSUMPTION_QUANTITY"
            FROM "INVENTORY_MOVEMENT" AS "im"
            INNER JOIN "INVENTORY_MOVEMENT_DETAIL" AS "imd"
              ON "imd"."MOVEMENT_ID" = "im"."MOVEMENT_ID"
            WHERE "im"."BUSINESS_ID" = $1
              AND "im"."STATE" = 'A'
              AND "im"."MOVEMENT_TYPE" = 'WORK_ORDER_CONSUMPTION'
              AND ($2::date IS NULL OR "im"."MOVEMENT_DATE"::date >= $2::date)
              AND ($3::date IS NULL OR "im"."MOVEMENT_DATE"::date <= $3::date)
              AND (
                ($4::varchar IS NULL AND $5::integer IS NULL)
                OR EXISTS (
                  SELECT 1
                  FROM "WORK_ORDER_TECHNICIAN" AS "wot_filter"
                  INNER JOIN "STAFF" AS "s_filter"
                    ON "s_filter"."STAFF_ID" = "wot_filter"."STAFF_ID"
                  WHERE "wot_filter"."WORK_ORDER_ID" = "im"."REFERENCE_ID"
                    AND "wot_filter"."STATE" = 'A'
                    AND "s_filter"."STATE" = 'A'
                    AND ($4::varchar IS NULL OR "s_filter"."EMPLOYEE_TYPE" = $4::varchar)
                    AND ($5::integer IS NULL OR "s_filter"."STAFF_ID" = $5::integer)
                )
              )
          `,
          values
        ),
        queryRunner<Pick<SummaryRow, 'ARTICLES_BELOW_MINIMUM'>>(
          `
            SELECT COUNT(*) AS "ARTICLES_BELOW_MINIMUM"
            FROM "ARTICLE" AS "a"
            WHERE "a"."BUSINESS_ID" = $1
              AND "a"."STATE" = 'A'
              AND COALESCE("a"."CURRENT_STOCK", 0) < COALESCE("a"."MIN_STOCK", 0)
          `,
          [values[0]]
        ),
        queryRunner<Pick<SummaryRow, 'ACTIVE_SERVICE_VEHICLES'>>(
          `
            SELECT COUNT(*) AS "ACTIVE_SERVICE_VEHICLES"
            FROM "SERVICE_VEHICLE" AS "sv"
            WHERE "sv"."BUSINESS_ID" = $1
              AND "sv"."STATE" = 'A'
          `,
          [values[0]]
        ),
        queryRunner<Pick<SummaryRow, 'SERVICE_VEHICLE_HISTORY_EVENTS'>>(
          `
            SELECT COUNT(*) AS "SERVICE_VEHICLE_HISTORY_EVENTS"
            FROM "ACTIVITY_LOG" AS "al"
            INNER JOIN "STAFF" AS "s"
              ON "s"."STAFF_ID" = "al"."STAFF_ID"
            WHERE "s"."BUSINESS_ID" = $1
              AND "al"."MODEL" = 'ServiceVehicle'
              AND ($2::date IS NULL OR "al"."CREATED_AT"::date >= $2::date)
              AND ($3::date IS NULL OR "al"."CREATED_AT"::date <= $3::date)
              AND ($4::varchar IS NULL OR "s"."EMPLOYEE_TYPE" = $4::varchar)
              AND ($5::integer IS NULL OR "s"."STAFF_ID" = $5::integer)
          `,
          values
        ),
        queryRunner<
          Pick<
            SummaryRow,
            | 'PENDING_SERVICE_VEHICLE_MAINTENANCE'
            | 'OVERDUE_SERVICE_VEHICLE_MAINTENANCE'
          >
        >(
          `
            SELECT
              COUNT(*) FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
              ) AS "PENDING_SERVICE_VEHICLE_MAINTENANCE",
              COUNT(*) FILTER (
                WHERE "m"."STATUS" IN ('PENDIENTE', 'EN_PROCESO')
                  AND "m"."SCHEDULED_AT" IS NOT NULL
                  AND "m"."SCHEDULED_AT" < now()
              ) AS "OVERDUE_SERVICE_VEHICLE_MAINTENANCE"
            FROM "SERVICE_VEHICLE_MAINTENANCE" AS "m"
            WHERE "m"."BUSINESS_ID" = $1
              AND "m"."STATE" = 'A'
          `,
          [values[0]]
        ),
        queryRunner<Pick<SummaryRow, 'AVAILABLE_SERVICE_VEHICLES'>>(
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
            SELECT COUNT(*) FILTER (
              WHERE
                "sv"."STATE" = 'A'
                AND COALESCE("u"."CURRENT_USAGE_COUNT", 0) = 0
                AND COALESCE("m"."IN_PROGRESS_MAINTENANCE_COUNT", 0) = 0
            ) AS "AVAILABLE_SERVICE_VEHICLES"
            FROM "SERVICE_VEHICLE" AS "sv"
            LEFT JOIN "usage_open" AS "u"
              ON "u"."SERVICE_VEHICLE_ID" = "sv"."SERVICE_VEHICLE_ID"
            LEFT JOIN "maintenance_open" AS "m"
              ON "m"."SERVICE_VEHICLE_ID" = "sv"."SERVICE_VEHICLE_ID"
            WHERE "sv"."BUSINESS_ID" = $1
          `,
          [values[0]]
        ),
        queryRunner<
          Pick<
            SummaryRow,
            | 'TOTAL_SERVICE_VEHICLE_USAGE_HOURS'
            | 'TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS'
          >
        >(
          `
            SELECT
              ROUND(
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
              ) AS "TOTAL_SERVICE_VEHICLE_USAGE_HOURS",
              ROUND(
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
              ) AS "TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS"
            FROM "SERVICE_VEHICLE_USAGE" AS "u"
            LEFT JOIN "STAFF" AS "s"
              ON "s"."STAFF_ID" = "u"."STAFF_ID"
            WHERE "u"."BUSINESS_ID" = $1
              AND "u"."STATE" = 'A'
              AND "u"."STATUS" = 'FINALIZADA'
              AND ($2::date IS NULL OR "u"."STARTED_AT"::date >= $2::date)
              AND ($3::date IS NULL OR "u"."STARTED_AT"::date <= $3::date)
              AND ($4::varchar IS NULL OR "s"."EMPLOYEE_TYPE" = $4::varchar)
              AND ($5::integer IS NULL OR "s"."STAFF_ID" = $5::integer)
          `,
          values
        ),
      ])

    const opened = openedRow[0]
    const delivered = deliveredRow[0]
    const cancelled = cancelledRow[0]
    const receipts = receiptRow[0]
    const consumption = consumptionRow[0]
    const belowMinimum = belowMinRow[0]
    const serviceVehicles = serviceVehiclesRow[0]
    const serviceVehicleHistory = serviceVehicleHistoryRow[0]
    const serviceVehicleMaintenance = serviceVehicleMaintenanceRow[0]
    const serviceVehicleAvailability = serviceVehicleAvailabilityRow[0]
    const serviceVehicleUsageTotals = serviceVehicleUsageTotalsRow[0]

    return {
      OPENED_WORK_ORDERS: this.toNumber(opened?.OPENED_WORK_ORDERS),
      DELIVERED_WORK_ORDERS: this.toNumber(
        delivered?.DELIVERED_WORK_ORDERS
      ),
      CANCELLED_WORK_ORDERS: this.toNumber(
        cancelled?.CANCELLED_WORK_ORDERS
      ),
      DELIVERY_RECEIPTS: this.toNumber(receipts?.DELIVERY_RECEIPTS),
      INVENTORY_CONSUMPTION_QUANTITY: this.toNumber(
        consumption?.INVENTORY_CONSUMPTION_QUANTITY
      ),
      ARTICLES_BELOW_MINIMUM: this.toNumber(
        belowMinimum?.ARTICLES_BELOW_MINIMUM
      ),
      AVERAGE_CLOSURE_DAYS: this.toNumber(delivered?.AVERAGE_CLOSURE_DAYS),
      ACTIVE_SERVICE_VEHICLES: this.toNumber(
        serviceVehicles?.ACTIVE_SERVICE_VEHICLES
      ),
      SERVICE_VEHICLE_HISTORY_EVENTS: this.toNumber(
        serviceVehicleHistory?.SERVICE_VEHICLE_HISTORY_EVENTS
      ),
      PENDING_SERVICE_VEHICLE_MAINTENANCE: this.toNumber(
        serviceVehicleMaintenance?.PENDING_SERVICE_VEHICLE_MAINTENANCE
      ),
      OVERDUE_SERVICE_VEHICLE_MAINTENANCE: this.toNumber(
        serviceVehicleMaintenance?.OVERDUE_SERVICE_VEHICLE_MAINTENANCE
      ),
      AVAILABLE_SERVICE_VEHICLES: this.toNumber(
        serviceVehicleAvailability?.AVAILABLE_SERVICE_VEHICLES
      ),
      TOTAL_SERVICE_VEHICLE_USAGE_HOURS: this.toNumber(
        serviceVehicleUsageTotals?.TOTAL_SERVICE_VEHICLE_USAGE_HOURS
      ),
      TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS: this.toNumber(
        serviceVehicleUsageTotals?.TOTAL_SERVICE_VEHICLE_USAGE_KILOMETERS
      ),
    }
  }

  private async getWorkOrdersByStatus(
    values: unknown[]
  ): Promise<WorkOrdersByStatusReportItem[]> {
    const rows = await queryRunner<WorkOrdersByStatusRow>(
      `
        SELECT
          "ws"."CODE" AS "STATUS_CODE",
          "ws"."NAME" AS "STATUS_NAME",
          COUNT(*) AS "TOTAL"
        FROM "WORK_ORDER" AS "wo"
        INNER JOIN "WORK_ORDER_STATUS" AS "ws"
          ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
        WHERE "wo"."BUSINESS_ID" = $1
          AND "wo"."STATE" = 'A'
          AND ($2::date IS NULL OR "wo"."OPENED_AT"::date >= $2::date)
          AND ($3::date IS NULL OR "wo"."OPENED_AT"::date <= $3::date)
          ${this.getWorkOrderEmployeeTypeClause('wo')}
        GROUP BY "ws"."CODE", "ws"."NAME", "ws"."ORDER_INDEX"
        ORDER BY "ws"."ORDER_INDEX" ASC, "ws"."NAME" ASC
      `,
      values
    )

    return rows.map((item) => ({
      STATUS_CODE: item.STATUS_CODE || 'N/A',
      STATUS_NAME: item.STATUS_NAME || 'Sin estado',
      TOTAL: this.toNumber(item.TOTAL),
    }))
  }

  private async getTopConsumedArticles(
    values: unknown[]
  ): Promise<TopConsumedArticleReportItem[]> {
    const rows = await queryRunner<TopConsumedArticleRow>(
      `
        SELECT
          "a"."ARTICLE_ID" AS "ARTICLE_ID",
          "a"."CODE" AS "ARTICLE_CODE",
          "a"."NAME" AS "ARTICLE_NAME",
          ROUND(COALESCE(SUM("imd"."QUANTITY"), 0)::numeric, 2) AS "TOTAL_QUANTITY",
          COUNT(DISTINCT "im"."MOVEMENT_ID") AS "MOVEMENT_COUNT",
          ROUND(
            COALESCE(
              SUM("imd"."QUANTITY" * COALESCE("imd"."UNIT_COST_REFERENCE", "a"."COST_REFERENCE", 0)),
              0
            )::numeric,
            2
          ) AS "TOTAL_ESTIMATED_COST"
        FROM "INVENTORY_MOVEMENT" AS "im"
        INNER JOIN "INVENTORY_MOVEMENT_DETAIL" AS "imd"
          ON "imd"."MOVEMENT_ID" = "im"."MOVEMENT_ID"
        INNER JOIN "ARTICLE" AS "a"
          ON "a"."ARTICLE_ID" = "imd"."ARTICLE_ID"
        WHERE "im"."BUSINESS_ID" = $1
          AND "im"."STATE" = 'A'
          AND "a"."STATE" = 'A'
          AND "im"."MOVEMENT_TYPE" = 'WORK_ORDER_CONSUMPTION'
          AND ($2::date IS NULL OR "im"."MOVEMENT_DATE"::date >= $2::date)
          AND ($3::date IS NULL OR "im"."MOVEMENT_DATE"::date <= $3::date)
          AND (
            $4::varchar IS NULL
            OR EXISTS (
              SELECT 1
              FROM "WORK_ORDER_TECHNICIAN" AS "wot_filter"
              INNER JOIN "STAFF" AS "s_filter"
                ON "s_filter"."STAFF_ID" = "wot_filter"."STAFF_ID"
              WHERE "wot_filter"."WORK_ORDER_ID" = "im"."REFERENCE_ID"
                AND "wot_filter"."STATE" = 'A'
                AND "s_filter"."STATE" = 'A'
                AND "s_filter"."EMPLOYEE_TYPE" = $4::varchar
            )
          )
        GROUP BY "a"."ARTICLE_ID", "a"."CODE", "a"."NAME"
        ORDER BY SUM("imd"."QUANTITY") DESC, "a"."NAME" ASC
        LIMIT 10
      `,
      values
    )

    return rows.map((item) => ({
      ARTICLE_ID: this.toNumber(item.ARTICLE_ID),
      ARTICLE_CODE: item.ARTICLE_CODE || '',
      ARTICLE_NAME: item.ARTICLE_NAME || '',
      TOTAL_QUANTITY: this.toNumber(item.TOTAL_QUANTITY),
      MOVEMENT_COUNT: this.toNumber(item.MOVEMENT_COUNT),
      TOTAL_ESTIMATED_COST: this.toNumber(item.TOTAL_ESTIMATED_COST),
    }))
  }

  private async getLowStockArticles(
    values: unknown[]
  ): Promise<LowStockArticleReportItem[]> {
    const rows = await queryRunner<LowStockArticleRow>(
      `
        SELECT
          "a"."ARTICLE_ID" AS "ARTICLE_ID",
          "a"."CODE" AS "CODE",
          "a"."NAME" AS "NAME",
          "a"."ITEM_TYPE" AS "ITEM_TYPE",
          "a"."CURRENT_STOCK" AS "CURRENT_STOCK",
          "a"."MIN_STOCK" AS "MIN_STOCK",
          ROUND(
            GREATEST(COALESCE("a"."MIN_STOCK", 0) - COALESCE("a"."CURRENT_STOCK", 0), 0)::numeric,
            2
          ) AS "DEFICIT",
          "a"."COST_REFERENCE" AS "COST_REFERENCE"
        FROM "ARTICLE" AS "a"
        WHERE "a"."BUSINESS_ID" = $1
          AND "a"."STATE" = 'A'
          AND COALESCE("a"."CURRENT_STOCK", 0) < COALESCE("a"."MIN_STOCK", 0)
        ORDER BY
          GREATEST(COALESCE("a"."MIN_STOCK", 0) - COALESCE("a"."CURRENT_STOCK", 0), 0) DESC,
          "a"."NAME" ASC
      `,
      values
    )

    return rows.map((item) => ({
      ARTICLE_ID: this.toNumber(item.ARTICLE_ID),
      CODE: item.CODE || '',
      NAME: item.NAME || '',
      ITEM_TYPE: item.ITEM_TYPE || '',
      CURRENT_STOCK: this.toNumber(item.CURRENT_STOCK),
      MIN_STOCK: this.toNumber(item.MIN_STOCK),
      DEFICIT: this.toNumber(item.DEFICIT),
      COST_REFERENCE:
        item.COST_REFERENCE == null ? null : this.toNumber(item.COST_REFERENCE),
    }))
  }

  private async getTopTechnicians(
    values: unknown[]
  ): Promise<TopTechnicianReportItem[]> {
    const rows = await queryRunner<TopTechnicianRow>(
      `
        SELECT
          "s"."STAFF_ID" AS "STAFF_ID",
          "s"."USERNAME" AS "USERNAME",
          TRIM(
            CONCAT(
              COALESCE("p"."NAME", ''),
              CASE
                WHEN "p"."LAST_NAME" IS NOT NULL AND TRIM("p"."LAST_NAME") <> '' THEN CONCAT(' ', "p"."LAST_NAME")
                ELSE ''
              END
            )
          ) AS "FULL_NAME",
          COUNT(DISTINCT "wot"."WORK_ORDER_ID") AS "TOTAL_ASSIGNED_ORDERS",
          COUNT(DISTINCT CASE WHEN "wot"."IS_LEAD" = TRUE THEN "wot"."WORK_ORDER_ID" END) AS "LEAD_ORDERS",
          COUNT(DISTINCT CASE WHEN "ws"."CODE" = 'ENTREGADA' THEN "wo"."WORK_ORDER_ID" END) AS "DELIVERED_ORDERS",
          COALESCE(SUM(COALESCE("svc"."TOTAL_SERVICE_LINES", 0)), 0) AS "TOTAL_SERVICE_LINES",
          ROUND(COALESCE(SUM(COALESCE("wot"."REFERENCE_AMOUNT", 0)), 0)::numeric, 2) AS "TOTAL_REFERENCE_AMOUNT"
        FROM "WORK_ORDER_TECHNICIAN" AS "wot"
        INNER JOIN "WORK_ORDER" AS "wo"
          ON "wo"."WORK_ORDER_ID" = "wot"."WORK_ORDER_ID"
        INNER JOIN "WORK_ORDER_STATUS" AS "ws"
          ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
        INNER JOIN "STAFF" AS "s"
          ON "s"."STAFF_ID" = "wot"."STAFF_ID"
        LEFT JOIN "PERSON" AS "p"
          ON "p"."PERSON_ID" = "s"."PERSON_ID"
        LEFT JOIN (
          SELECT
            "wosl"."WORK_ORDER_ID",
            COUNT(*) AS "TOTAL_SERVICE_LINES"
          FROM "WORK_ORDER_SERVICE_LINE" AS "wosl"
          WHERE "wosl"."STATE" = 'A'
          GROUP BY "wosl"."WORK_ORDER_ID"
        ) AS "svc"
          ON "svc"."WORK_ORDER_ID" = "wo"."WORK_ORDER_ID"
        WHERE "wo"."BUSINESS_ID" = $1
          AND "wo"."STATE" = 'A'
          AND "wot"."STATE" = 'A'
          AND "s"."STATE" = 'A'
          AND "s"."EMPLOYEE_TYPE" = 'OPERACIONAL'
          AND ($4::varchar IS NULL OR "s"."EMPLOYEE_TYPE" = $4::varchar)
          AND ($5::integer IS NULL OR "s"."STAFF_ID" = $5::integer)
          AND ($2::date IS NULL OR "wo"."OPENED_AT"::date >= $2::date)
          AND ($3::date IS NULL OR "wo"."OPENED_AT"::date <= $3::date)
        GROUP BY "s"."STAFF_ID", "s"."USERNAME", "p"."NAME", "p"."LAST_NAME"
        ORDER BY
          ROUND(COALESCE(SUM(COALESCE("wot"."REFERENCE_AMOUNT", 0)), 0)::numeric, 2) DESC,
          COUNT(DISTINCT "wot"."WORK_ORDER_ID") DESC,
          "FULL_NAME" ASC
        LIMIT 10
      `,
      values
    )

    return rows.map((item) => ({
      STAFF_ID: this.toNumber(item.STAFF_ID),
      USERNAME: item.USERNAME || '',
      FULL_NAME: item.FULL_NAME || item.USERNAME || '',
      TOTAL_ASSIGNED_ORDERS: this.toNumber(item.TOTAL_ASSIGNED_ORDERS),
      LEAD_ORDERS: this.toNumber(item.LEAD_ORDERS),
      DELIVERED_ORDERS: this.toNumber(item.DELIVERED_ORDERS),
      TOTAL_SERVICE_LINES: this.toNumber(item.TOTAL_SERVICE_LINES),
      TOTAL_REFERENCE_AMOUNT: this.toNumber(item.TOTAL_REFERENCE_AMOUNT),
    }))
  }

  private async getServiceVehiclesByState(
    values: unknown[]
  ): Promise<ServiceVehiclesByStateReportItem[]> {
    const rows = await queryRunner<ServiceVehiclesByStateRow>(
      `
        SELECT
          COALESCE("sv"."STATE", 'I') AS "STATE",
          COUNT(*) AS "TOTAL"
        FROM "SERVICE_VEHICLE" AS "sv"
        WHERE "sv"."BUSINESS_ID" = $1
        GROUP BY "sv"."STATE"
        ORDER BY "sv"."STATE" ASC
      `,
      values
    )

    return rows.map((item) => ({
      STATE: item.STATE || 'I',
      TOTAL: this.toNumber(item.TOTAL),
    }))
  }

  private async getServiceVehicleFleet(
    values: unknown[]
  ): Promise<ServiceVehicleFleetReportItem[]> {
    const rows = await queryRunner<ServiceVehicleFleetRow>(
      `
        SELECT
          COALESCE("sv"."BRAND", '') AS "BRAND",
          COALESCE("sv"."MODEL", '') AS "MODEL",
          COUNT(*) AS "TOTAL"
        FROM "SERVICE_VEHICLE" AS "sv"
        WHERE "sv"."BUSINESS_ID" = $1
        GROUP BY "sv"."BRAND", "sv"."MODEL"
        ORDER BY COUNT(*) DESC, "sv"."BRAND" ASC, "sv"."MODEL" ASC
        LIMIT 10
      `,
      values
    )

    return rows.map((item) => ({
      BRAND: item.BRAND || 'N/D',
      MODEL: item.MODEL || 'N/D',
      TOTAL: this.toNumber(item.TOTAL),
    }))
  }

  private async getServiceVehicleHistory(
    values: unknown[]
  ): Promise<ServiceVehicleHistoryReportItem[]> {
    const rows = await queryRunner<ServiceVehicleHistoryRow>(
      `
        SELECT
          "al"."ID" AS "ID",
          COALESCE("al"."ACTION", '') AS "ACTION",
          COALESCE("sv"."NAME", "al"."CHANGES"::jsonb ->> 'NAME', 'Vehículo de servicio') AS "VEHICLE_NAME",
          COALESCE("sv"."PLATE", "al"."CHANGES"::jsonb ->> 'PLATE', '') AS "PLATE",
          TRIM(CONCAT(COALESCE("p"."NAME", ''), ' ', COALESCE("p"."LAST_NAME", ''))) AS "ACTOR_NAME",
          COALESCE("s"."USERNAME", '') AS "USERNAME",
          COALESCE("s"."EMPLOYEE_TYPE", '') AS "EMPLOYEE_TYPE",
          "al"."CREATED_AT" AS "CREATED_AT"
        FROM "ACTIVITY_LOG" AS "al"
        INNER JOIN "STAFF" AS "s"
          ON "s"."STAFF_ID" = "al"."STAFF_ID"
        LEFT JOIN "PERSON" AS "p"
          ON "p"."PERSON_ID" = "s"."PERSON_ID"
        LEFT JOIN "SERVICE_VEHICLE" AS "sv"
          ON "sv"."SERVICE_VEHICLE_ID" = "al"."OBJECT_ID"
         AND "sv"."BUSINESS_ID" = $1
        WHERE "s"."BUSINESS_ID" = $1
          AND "al"."MODEL" = 'ServiceVehicle'
          AND ($2::date IS NULL OR "al"."CREATED_AT"::date >= $2::date)
          AND ($3::date IS NULL OR "al"."CREATED_AT"::date <= $3::date)
          AND ($4::varchar IS NULL OR "s"."EMPLOYEE_TYPE" = $4::varchar)
          AND ($5::integer IS NULL OR "s"."STAFF_ID" = $5::integer)
        ORDER BY "al"."CREATED_AT" DESC, "al"."ID" DESC
        LIMIT 20
      `,
      values
    )

    return rows.map((item) => ({
      ID: this.toNumber(item.ID),
      ACTION: item.ACTION || '',
      VEHICLE_NAME: item.VEHICLE_NAME || 'Vehículo de servicio',
      PLATE: item.PLATE || '',
      ACTOR_NAME: item.ACTOR_NAME || '',
      USERNAME: item.USERNAME || '',
      EMPLOYEE_TYPE: item.EMPLOYEE_TYPE || '',
      CREATED_AT: item.CREATED_AT,
    }))
  }

  private async getServiceVehicleMaintenanceByVehicle(
    values: unknown[]
  ): Promise<ServiceVehicleMaintenanceByVehicleReportItem[]> {
    const rows = await queryRunner<ServiceVehicleMaintenanceByVehicleRow>(
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
      `,
      values
    )

    return rows.map((item) => ({
      SERVICE_VEHICLE_ID: this.toNumber(item.SERVICE_VEHICLE_ID),
      VEHICLE_NAME: item.VEHICLE_NAME || 'Vehículo de servicio',
      PLATE: item.PLATE || '',
      PENDING_TOTAL: this.toNumber(item.PENDING_TOTAL),
      OVERDUE_TOTAL: this.toNumber(item.OVERDUE_TOTAL),
      NEXT_SCHEDULED_AT: item.NEXT_SCHEDULED_AT,
    }))
  }

  private async getServiceVehicleUsageByVehicle(
    values: unknown[]
  ): Promise<ServiceVehicleUsageByVehicleReportItem[]> {
    const rows = await queryRunner<ServiceVehicleUsageByVehicleRow>(
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
          MAX("u"."ENDED_AT") AS "LAST_USAGE_AT"
        FROM "SERVICE_VEHICLE_USAGE" AS "u"
        INNER JOIN "SERVICE_VEHICLE" AS "sv"
          ON "sv"."SERVICE_VEHICLE_ID" = "u"."SERVICE_VEHICLE_ID"
        LEFT JOIN "STAFF" AS "s"
          ON "s"."STAFF_ID" = "u"."STAFF_ID"
        WHERE "u"."BUSINESS_ID" = $1
          AND "u"."STATE" = 'A'
          AND "u"."STATUS" = 'FINALIZADA'
          AND ($2::date IS NULL OR "u"."STARTED_AT"::date >= $2::date)
          AND ($3::date IS NULL OR "u"."STARTED_AT"::date <= $3::date)
          AND ($4::varchar IS NULL OR "s"."EMPLOYEE_TYPE" = $4::varchar)
          AND ($5::integer IS NULL OR "s"."STAFF_ID" = $5::integer)
        GROUP BY "sv"."SERVICE_VEHICLE_ID", "sv"."NAME", "sv"."PLATE"
        ORDER BY "TOTAL_KILOMETERS" DESC, "TOTAL_HOURS" DESC, "sv"."NAME" ASC
        LIMIT 20
      `,
      values
    )

    return rows.map((item) => ({
      SERVICE_VEHICLE_ID: this.toNumber(item.SERVICE_VEHICLE_ID),
      VEHICLE_NAME: item.VEHICLE_NAME || 'Vehículo de servicio',
      PLATE: item.PLATE || '',
      TOTAL_USAGES: this.toNumber(item.TOTAL_USAGES),
      TOTAL_HOURS: this.toNumber(item.TOTAL_HOURS),
      TOTAL_KILOMETERS: this.toNumber(item.TOTAL_KILOMETERS),
      LAST_USAGE_AT: item.LAST_USAGE_AT,
    }))
  }

  private async getServiceVehicleAvailability(
    values: unknown[]
  ): Promise<ServiceVehicleAvailabilityReportItem[]> {
    const rows = await queryRunner<ServiceVehicleAvailabilityRow>(
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
          COALESCE("m"."OPEN_MAINTENANCE_COUNT", 0) AS "OPEN_MAINTENANCE_COUNT",
          COALESCE("m"."IN_PROGRESS_MAINTENANCE_COUNT", 0) AS "IN_PROGRESS_MAINTENANCE_COUNT"
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
      `,
      values
    )

    return rows.map((item) => ({
      SERVICE_VEHICLE_ID: this.toNumber(item.SERVICE_VEHICLE_ID),
      VEHICLE_NAME: item.VEHICLE_NAME || 'Vehículo de servicio',
      PLATE: item.PLATE || '',
      BRAND: item.BRAND || '',
      MODEL: item.MODEL || '',
      AVAILABILITY_STATUS: item.AVAILABILITY_STATUS || 'DISPONIBLE',
      CURRENT_USAGE_COUNT: this.toNumber(item.CURRENT_USAGE_COUNT),
      OPEN_MAINTENANCE_COUNT: this.toNumber(item.OPEN_MAINTENANCE_COUNT),
      IN_PROGRESS_MAINTENANCE_COUNT: this.toNumber(
        item.IN_PROGRESS_MAINTENANCE_COUNT
      ),
    }))
  }

  private async resolveStaffLabel(
    businessId: number,
    staffId: number | null
  ): Promise<string | null> {
    if (!staffId) return null

    const rows = await queryRunner<{
      FULL_NAME: string | null
      USERNAME: string | null
    }>(
      `
        SELECT
          TRIM(CONCAT(COALESCE("p"."NAME", ''), ' ', COALESCE("p"."LAST_NAME", ''))) AS "FULL_NAME",
          COALESCE("s"."USERNAME", '') AS "USERNAME"
        FROM "STAFF" AS "s"
        LEFT JOIN "PERSON" AS "p"
          ON "p"."PERSON_ID" = "s"."PERSON_ID"
        WHERE "s"."BUSINESS_ID" = $1
          AND "s"."STAFF_ID" = $2
        LIMIT 1
      `,
      [businessId, staffId]
    )

    const row = rows[0]

    if (!row) return null

    const fullName = row.FULL_NAME?.trim() || ''
    const username = row.USERNAME?.trim() || ''

    if (fullName && username) return `${fullName} (@${username})`
    return fullName || username || null
  }
}
