import { queryRunner } from '@src/helpers/query-utils'
import { ApiResponse } from '@src/types/api.types'
import { BaseService, CatchServiceError } from './base.service'

type ReportPayload = {
  START_DATE?: string | null
  END_DATE?: string | null
}

type SummaryRow = {
  OPENED_WORK_ORDERS: number | string | null
  DELIVERED_WORK_ORDERS: number | string | null
  CANCELLED_WORK_ORDERS: number | string | null
  DELIVERY_RECEIPTS: number | string | null
  INVENTORY_CONSUMPTION_QUANTITY: number | string | null
  ARTICLES_BELOW_MINIMUM: number | string | null
  AVERAGE_CLOSURE_DAYS: number | string | null
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
}

export type OperationalReportSummary = {
  OPENED_WORK_ORDERS: number
  DELIVERED_WORK_ORDERS: number
  CANCELLED_WORK_ORDERS: number
  DELIVERY_RECEIPTS: number
  INVENTORY_CONSUMPTION_QUANTITY: number
  ARTICLES_BELOW_MINIMUM: number
  AVERAGE_CLOSURE_DAYS: number
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
}

export type OperationalReportResponse = {
  FILTERS: {
    START_DATE: string | null
    END_DATE: string | null
  }
  SUMMARY: OperationalReportSummary
  WORK_ORDERS_BY_STATUS: WorkOrdersByStatusReportItem[]
  TOP_CONSUMED_ARTICLES: TopConsumedArticleReportItem[]
  LOW_STOCK_ARTICLES: LowStockArticleReportItem[]
  TOP_TECHNICIANS: TopTechnicianReportItem[]
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
    ]

    const [
      summary,
      workOrdersByStatus,
      topConsumedArticles,
      lowStockArticles,
      topTechnicians,
    ] = await Promise.all([
      this.getSummary(values),
      this.getWorkOrdersByStatus(values),
      this.getTopConsumedArticles(values),
      this.getLowStockArticles([businessId]),
      this.getTopTechnicians(values),
    ])

    return this.success({
      data: {
        FILTERS: normalizedPayload,
        SUMMARY: summary,
        WORK_ORDERS_BY_STATUS: workOrdersByStatus,
        TOP_CONSUMED_ARTICLES: topConsumedArticles,
        LOW_STOCK_ARTICLES: lowStockArticles,
        TOP_TECHNICIANS: topTechnicians,
      },
    })
  }

  private normalizePayload(payload: ReportPayload): {
    START_DATE: string | null
    END_DATE: string | null
  } {
    const startDate = payload.START_DATE?.trim?.() || null
    const endDate = payload.END_DATE?.trim?.() || null

    return {
      START_DATE: startDate,
      END_DATE: endDate,
    }
  }

  private toNumber(value: unknown): number {
    if (value == null || value === '') return 0
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }

  private async getSummary(values: unknown[]): Promise<OperationalReportSummary> {
    const [openedRow, deliveredRow, cancelledRow, receiptRow, consumptionRow, belowMinRow] =
      await Promise.all([
        queryRunner<Pick<SummaryRow, 'OPENED_WORK_ORDERS'>>(
          `
            SELECT COUNT(*) AS "OPENED_WORK_ORDERS"
            FROM "WORK_ORDER" AS "wo"
            WHERE "wo"."BUSINESS_ID" = $1
              AND "wo"."STATE" = 'A'
              AND ($2::date IS NULL OR "wo"."OPENED_AT"::date >= $2::date)
              AND ($3::date IS NULL OR "wo"."OPENED_AT"::date <= $3::date)
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
          `,
          values
        ),
        queryRunner<Pick<SummaryRow, 'DELIVERY_RECEIPTS'>>(
          `
            SELECT COUNT(*) AS "DELIVERY_RECEIPTS"
            FROM "DELIVERY_RECEIPT" AS "dr"
            WHERE "dr"."BUSINESS_ID" = $1
              AND "dr"."STATE" = 'A'
              AND ($2::date IS NULL OR "dr"."DELIVERY_DATE"::date >= $2::date)
              AND ($3::date IS NULL OR "dr"."DELIVERY_DATE"::date <= $3::date)
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
      ])

    const opened = openedRow[0]
    const delivered = deliveredRow[0]
    const cancelled = cancelledRow[0]
    const receipts = receiptRow[0]
    const consumption = consumptionRow[0]
    const belowMinimum = belowMinRow[0]

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
          COUNT(DISTINCT CASE WHEN "ws"."CODE" = 'ENTREGADA' THEN "wo"."WORK_ORDER_ID" END) AS "DELIVERED_ORDERS"
        FROM "WORK_ORDER_TECHNICIAN" AS "wot"
        INNER JOIN "WORK_ORDER" AS "wo"
          ON "wo"."WORK_ORDER_ID" = "wot"."WORK_ORDER_ID"
        INNER JOIN "WORK_ORDER_STATUS" AS "ws"
          ON "ws"."STATUS_ID" = "wo"."STATUS_ID"
        INNER JOIN "STAFF" AS "s"
          ON "s"."STAFF_ID" = "wot"."STAFF_ID"
        LEFT JOIN "PERSON" AS "p"
          ON "p"."PERSON_ID" = "s"."PERSON_ID"
        WHERE "wo"."BUSINESS_ID" = $1
          AND "wo"."STATE" = 'A'
          AND "wot"."STATE" = 'A'
          AND "s"."STATE" = 'A'
          AND ($2::date IS NULL OR "wo"."OPENED_AT"::date >= $2::date)
          AND ($3::date IS NULL OR "wo"."OPENED_AT"::date <= $3::date)
        GROUP BY "s"."STAFF_ID", "s"."USERNAME", "p"."NAME", "p"."LAST_NAME"
        ORDER BY COUNT(DISTINCT "wot"."WORK_ORDER_ID") DESC, "FULL_NAME" ASC
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
    }))
  }
}
