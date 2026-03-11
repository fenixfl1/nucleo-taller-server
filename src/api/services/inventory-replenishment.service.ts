import { Article } from '@entity/Article'
import { BadRequestError } from '@api/errors/http.error'
import { paginatedQuery, queryRunner } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
} from '@src/types/api.types'
import { BaseService, CatchServiceError } from './base.service'

type InventoryReplenishmentRow = {
  ARTICLE_ID: number | string
  CODE: string | null
  NAME: string | null
  ITEM_TYPE: string | null
  UNIT_MEASURE: string | null
  CATEGORY: string | null
  CURRENT_STOCK: number | string | null
  MIN_STOCK: number | string | null
  MAX_STOCK: number | string | null
  COST_REFERENCE: number | string | null
  TOTAL_CONSUMED: number | string | null
  AVG_MONTHLY_CONSUMPTION: number | string | null
  TARGET_STOCK: number | string | null
  SUGGESTED_REPLENISHMENT: number | string | null
  LAST_MOVEMENT_DATE: Date | string | null
  LAST_CONSUMPTION_DATE: Date | string | null
  COMPATIBILITY_COUNT: number | string | null
  IS_BELOW_MINIMUM: boolean | string | number | null
  IS_ACTIONABLE: boolean | string | number | null
  STATE: string | null
}

export type InventoryReplenishmentResponse = {
  ARTICLE_ID: number
  CODE: string
  NAME: string
  ITEM_TYPE: string
  UNIT_MEASURE: string
  CATEGORY: string
  CURRENT_STOCK: number
  MIN_STOCK: number
  MAX_STOCK: number | null
  COST_REFERENCE: number | null
  TOTAL_CONSUMED: number
  AVG_MONTHLY_CONSUMPTION: number
  TARGET_STOCK: number
  SUGGESTED_REPLENISHMENT: number
  LAST_MOVEMENT_DATE: Date | null
  LAST_CONSUMPTION_DATE: Date | null
  COMPATIBILITY_COUNT: number
  IS_BELOW_MINIMUM: boolean
  IS_ACTIONABLE: boolean
  MONTH_WINDOW: number
  STATE: string
}

type InventoryReplenishmentSummaryRow = {
  BELOW_MINIMUM_COUNT: number | string | null
  ACTIONABLE_COUNT: number | string | null
  TOTAL_SUGGESTED_QUANTITY: number | string | null
  ESTIMATED_VALUE: number | string | null
}

export type InventoryReplenishmentSummaryResponse = {
  BELOW_MINIMUM_COUNT: number
  ACTIONABLE_COUNT: number
  TOTAL_SUGGESTED_QUANTITY: number
  ESTIMATED_VALUE: number
  MONTH_WINDOW: number
}

export class InventoryReplenishmentService extends BaseService {
  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<Article>[] = [],
    pagination: Pagination,
    months = 3
  ): Promise<ApiResponse<InventoryReplenishmentResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedMonths = this.normalizeMonthWindow(months)
    const { whereClause, values } = this.buildWhereClause(conditions)
    const datasetStatement = this.buildDatasetStatement(
      Number(businessId),
      normalizedMonths
    )
    const statement = `
      SELECT
        "ARTICLE_ID",
        "CODE",
        "NAME",
        "ITEM_TYPE",
        "UNIT_MEASURE",
        "CATEGORY",
        "CURRENT_STOCK",
        "MIN_STOCK",
        "MAX_STOCK",
        "COST_REFERENCE",
        "TOTAL_CONSUMED",
        "AVG_MONTHLY_CONSUMPTION",
        "TARGET_STOCK",
        "SUGGESTED_REPLENISHMENT",
        "LAST_MOVEMENT_DATE",
        "LAST_CONSUMPTION_DATE",
        "COMPATIBILITY_COUNT",
        "IS_BELOW_MINIMUM",
        "IS_ACTIONABLE",
        "STATE"
      FROM (${datasetStatement}) AS "inventory_replenishment_rows"
      ${whereClause}
      ORDER BY
        "IS_ACTIONABLE" DESC,
        "SUGGESTED_REPLENISHMENT" DESC,
        "IS_BELOW_MINIMUM" DESC,
        "CURRENT_STOCK" ASC,
        "NAME" ASC
    `

    const [data, metadata] = await paginatedQuery<InventoryReplenishmentRow>({
      statement,
      values,
      pagination,
    })

    return {
      ...this.success({
        data: data.map((item) => this.mapRow(item, normalizedMonths)),
        metadata,
      }),
    }
  }

  @CatchServiceError()
  async getSummary(
    conditions: AdvancedCondition<Article>[] = [],
    months = 3
  ): Promise<ApiResponse<InventoryReplenishmentSummaryResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedMonths = this.normalizeMonthWindow(months)
    const { whereClause, values } = this.buildWhereClause(conditions)
    const datasetStatement = this.buildDatasetStatement(
      Number(businessId),
      normalizedMonths
    )
    const statement = `
      SELECT
        COUNT(*) FILTER (WHERE "IS_BELOW_MINIMUM" = TRUE) AS "BELOW_MINIMUM_COUNT",
        COUNT(*) FILTER (WHERE "IS_ACTIONABLE" = TRUE) AS "ACTIONABLE_COUNT",
        ROUND(COALESCE(SUM("SUGGESTED_REPLENISHMENT"), 0)::numeric, 2) AS "TOTAL_SUGGESTED_QUANTITY",
        ROUND(COALESCE(SUM("SUGGESTED_REPLENISHMENT" * COALESCE("COST_REFERENCE", 0)), 0)::numeric, 2) AS "ESTIMATED_VALUE"
      FROM (${datasetStatement}) AS "inventory_replenishment_rows"
      ${whereClause}
    `

    const [row] = await queryRunner<InventoryReplenishmentSummaryRow>(
      statement,
      values
    )

    return this.success({
      data: {
        BELOW_MINIMUM_COUNT: Number(row?.BELOW_MINIMUM_COUNT || 0),
        ACTIONABLE_COUNT: Number(row?.ACTIONABLE_COUNT || 0),
        TOTAL_SUGGESTED_QUANTITY: this.toNumber(
          row?.TOTAL_SUGGESTED_QUANTITY
        ),
        ESTIMATED_VALUE: this.toNumber(row?.ESTIMATED_VALUE),
        MONTH_WINDOW: normalizedMonths,
      },
    })
  }

  private buildWhereClause(
    conditions: AdvancedCondition<Article>[] = []
  ): {
    whereClause: string
    values: unknown[]
  } {
    const normalizedConditions = preparePaginationConditions(conditions, [
      'CODE',
      'NAME',
      'ITEM_TYPE',
      'UNIT_MEASURE',
      'CATEGORY',
    ])

    return whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
  }

  private buildDatasetStatement(businessId: number, monthWindow: number): string {
    return `
      SELECT
        "replenishment_base"."ARTICLE_ID" AS "ARTICLE_ID",
        "replenishment_base"."CODE" AS "CODE",
        "replenishment_base"."NAME" AS "NAME",
        "replenishment_base"."ITEM_TYPE" AS "ITEM_TYPE",
        "replenishment_base"."UNIT_MEASURE" AS "UNIT_MEASURE",
        "replenishment_base"."CATEGORY" AS "CATEGORY",
        "replenishment_base"."CURRENT_STOCK" AS "CURRENT_STOCK",
        "replenishment_base"."MIN_STOCK" AS "MIN_STOCK",
        "replenishment_base"."MAX_STOCK" AS "MAX_STOCK",
        "replenishment_base"."COST_REFERENCE" AS "COST_REFERENCE",
        "replenishment_base"."TOTAL_CONSUMED" AS "TOTAL_CONSUMED",
        "replenishment_base"."AVG_MONTHLY_CONSUMPTION" AS "AVG_MONTHLY_CONSUMPTION",
        ROUND(
          CASE
            WHEN "replenishment_base"."MAX_STOCK" IS NOT NULL THEN
              LEAST(
                "replenishment_base"."MAX_STOCK",
                "replenishment_base"."MIN_STOCK" +
                  "replenishment_base"."AVG_MONTHLY_CONSUMPTION"
              )
            ELSE
              "replenishment_base"."MIN_STOCK" +
                "replenishment_base"."AVG_MONTHLY_CONSUMPTION"
          END,
          2
        ) AS "TARGET_STOCK",
        ROUND(
          GREATEST(
            0,
            CASE
              WHEN "replenishment_base"."MAX_STOCK" IS NOT NULL THEN
                LEAST(
                  "replenishment_base"."MAX_STOCK",
                  "replenishment_base"."MIN_STOCK" +
                    "replenishment_base"."AVG_MONTHLY_CONSUMPTION"
                )
              ELSE
                "replenishment_base"."MIN_STOCK" +
                  "replenishment_base"."AVG_MONTHLY_CONSUMPTION"
            END - "replenishment_base"."CURRENT_STOCK"
          ),
          2
        ) AS "SUGGESTED_REPLENISHMENT",
        "replenishment_base"."LAST_MOVEMENT_DATE" AS "LAST_MOVEMENT_DATE",
        "replenishment_base"."LAST_CONSUMPTION_DATE" AS "LAST_CONSUMPTION_DATE",
        "replenishment_base"."COMPATIBILITY_COUNT" AS "COMPATIBILITY_COUNT",
        ("replenishment_base"."CURRENT_STOCK" < "replenishment_base"."MIN_STOCK") AS "IS_BELOW_MINIMUM",
        (
          GREATEST(
            0,
            CASE
              WHEN "replenishment_base"."MAX_STOCK" IS NOT NULL THEN
                LEAST(
                  "replenishment_base"."MAX_STOCK",
                  "replenishment_base"."MIN_STOCK" +
                    "replenishment_base"."AVG_MONTHLY_CONSUMPTION"
                )
              ELSE
                "replenishment_base"."MIN_STOCK" +
                  "replenishment_base"."AVG_MONTHLY_CONSUMPTION"
            END - "replenishment_base"."CURRENT_STOCK"
          ) > 0
        ) AS "IS_ACTIONABLE",
        "replenishment_base"."STATE" AS "STATE"
      FROM (
        SELECT
          "a"."ARTICLE_ID" AS "ARTICLE_ID",
          "a"."CODE" AS "CODE",
          "a"."NAME" AS "NAME",
          "a"."ITEM_TYPE" AS "ITEM_TYPE",
          "a"."UNIT_MEASURE" AS "UNIT_MEASURE",
          "a"."CATEGORY" AS "CATEGORY",
          "a"."CURRENT_STOCK" AS "CURRENT_STOCK",
          "a"."MIN_STOCK" AS "MIN_STOCK",
          "a"."MAX_STOCK" AS "MAX_STOCK",
          "a"."COST_REFERENCE" AS "COST_REFERENCE",
          ROUND(COALESCE("consumption"."TOTAL_CONSUMED", 0)::numeric, 2) AS "TOTAL_CONSUMED",
          ROUND(
            (COALESCE("consumption"."TOTAL_CONSUMED", 0)::numeric / ${monthWindow}),
            2
          ) AS "AVG_MONTHLY_CONSUMPTION",
          "last_movement"."LAST_MOVEMENT_DATE" AS "LAST_MOVEMENT_DATE",
          "consumption"."LAST_CONSUMPTION_DATE" AS "LAST_CONSUMPTION_DATE",
          (
            SELECT COUNT(*)
            FROM "ARTICLE_COMPATIBILITY" "ac"
            WHERE "ac"."ARTICLE_ID" = "a"."ARTICLE_ID"
          ) AS "COMPATIBILITY_COUNT",
          "a"."STATE" AS "STATE"
        FROM "ARTICLE" "a"
        LEFT JOIN (
          SELECT
            "imd"."ARTICLE_ID" AS "ARTICLE_ID",
            SUM("imd"."QUANTITY") AS "TOTAL_CONSUMED",
            MAX("im"."MOVEMENT_DATE") AS "LAST_CONSUMPTION_DATE"
          FROM "INVENTORY_MOVEMENT_DETAIL" "imd"
          INNER JOIN "INVENTORY_MOVEMENT" "im"
            ON "im"."MOVEMENT_ID" = "imd"."MOVEMENT_ID"
          WHERE "im"."BUSINESS_ID" = ${businessId}
            AND "im"."STATE" = 'A'
            AND "im"."MOVEMENT_TYPE" IN (
              'EXIT',
              'ADJUSTMENT_OUT',
              'WORK_ORDER_CONSUMPTION'
            )
            AND "im"."MOVEMENT_DATE" >= CURRENT_TIMESTAMP - INTERVAL '${monthWindow} months'
          GROUP BY "imd"."ARTICLE_ID"
        ) AS "consumption"
          ON "consumption"."ARTICLE_ID" = "a"."ARTICLE_ID"
        LEFT JOIN (
          SELECT
            "imd"."ARTICLE_ID" AS "ARTICLE_ID",
            MAX("im"."MOVEMENT_DATE") AS "LAST_MOVEMENT_DATE"
          FROM "INVENTORY_MOVEMENT_DETAIL" "imd"
          INNER JOIN "INVENTORY_MOVEMENT" "im"
            ON "im"."MOVEMENT_ID" = "imd"."MOVEMENT_ID"
          WHERE "im"."BUSINESS_ID" = ${businessId}
            AND "im"."STATE" = 'A'
          GROUP BY "imd"."ARTICLE_ID"
        ) AS "last_movement"
          ON "last_movement"."ARTICLE_ID" = "a"."ARTICLE_ID"
        WHERE "a"."BUSINESS_ID" = ${businessId}
      ) AS "replenishment_base"
    `
  }

  private mapRow(
    row: InventoryReplenishmentRow,
    monthWindow: number
  ): InventoryReplenishmentResponse {
    return {
      ARTICLE_ID: Number(row.ARTICLE_ID),
      CODE: row.CODE || '',
      NAME: row.NAME || '',
      ITEM_TYPE: row.ITEM_TYPE || '',
      UNIT_MEASURE: row.UNIT_MEASURE || '',
      CATEGORY: row.CATEGORY || '',
      CURRENT_STOCK: this.toNumber(row.CURRENT_STOCK),
      MIN_STOCK: this.toNumber(row.MIN_STOCK),
      MAX_STOCK:
        row.MAX_STOCK === null || row.MAX_STOCK === undefined
          ? null
          : this.toNumber(row.MAX_STOCK),
      COST_REFERENCE:
        row.COST_REFERENCE === null || row.COST_REFERENCE === undefined
          ? null
          : this.toNumber(row.COST_REFERENCE),
      TOTAL_CONSUMED: this.toNumber(row.TOTAL_CONSUMED),
      AVG_MONTHLY_CONSUMPTION: this.toNumber(row.AVG_MONTHLY_CONSUMPTION),
      TARGET_STOCK: this.toNumber(row.TARGET_STOCK),
      SUGGESTED_REPLENISHMENT: this.toNumber(row.SUGGESTED_REPLENISHMENT),
      LAST_MOVEMENT_DATE: row.LAST_MOVEMENT_DATE
        ? new Date(row.LAST_MOVEMENT_DATE)
        : null,
      LAST_CONSUMPTION_DATE: row.LAST_CONSUMPTION_DATE
        ? new Date(row.LAST_CONSUMPTION_DATE)
        : null,
      COMPATIBILITY_COUNT:
        row.COMPATIBILITY_COUNT === null || row.COMPATIBILITY_COUNT === undefined
          ? 0
          : Number(row.COMPATIBILITY_COUNT),
      IS_BELOW_MINIMUM: this.toBoolean(row.IS_BELOW_MINIMUM),
      IS_ACTIONABLE: this.toBoolean(row.IS_ACTIONABLE),
      MONTH_WINDOW: monthWindow,
      STATE: row.STATE || 'A',
    }
  }

  private normalizeMonthWindow(value: number): number {
    const normalized = Number(value)

    if (!Number.isInteger(normalized) || normalized < 1 || normalized > 24) {
      throw new BadRequestError(
        'El parámetro months debe ser un número entero entre 1 y 24.'
      )
    }

    return normalized
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      return value > 0
    }

    return `${value || ''}`.toUpperCase() === 'TRUE'
  }

  private toNumber(value: unknown): number {
    const normalized = Number(value || 0)
    return Number.isNaN(normalized) ? 0 : normalized
  }
}
