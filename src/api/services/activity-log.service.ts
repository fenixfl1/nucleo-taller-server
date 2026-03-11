import { ActivityLog } from '@entity/ActivityLog'
import { NotFoundError } from '@api/errors/http.error'
import { paginatedQuery, queryRunner } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
} from '@src/types/api.types'
import { BaseService, CatchServiceError } from './base.service'

type ActivityLogRow = {
  ID: number | string
  STAFF_ID: number | string
  ACTION: string | null
  MODEL: string | null
  OBJECT_ID: number | string | null
  CHANGES: Record<string, unknown> | null
  CREATED_AT: Date | string | null
  IP: string | null
  USER_AGENT: string | null
  USERNAME: string | null
  STAFF_NAME: string | null
}

export type ActivityLogResponse = {
  ID: number
  STAFF_ID: number
  ACTION: string
  MODEL: string
  OBJECT_ID: number | null
  CHANGES: Record<string, unknown> | null
  CREATED_AT: Date | null
  IP: string
  USER_AGENT: string
  USERNAME: string
  STAFF_NAME: string
}

export class ActivityLogService extends BaseService {
  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<ActivityLog>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<ActivityLogResponse[]>> {
    const normalizedConditions = preparePaginationConditions(conditions, [
      'ACTION',
      'MODEL',
      'USERNAME',
      'STAFF_NAME',
      'IP',
      'USER_AGENT',
      'OBJECT_ID',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )

    const statement = `
      SELECT
        "ID",
        "STAFF_ID",
        "ACTION",
        "MODEL",
        "OBJECT_ID",
        "CHANGES",
        "CREATED_AT",
        "IP",
        "USER_AGENT",
        "USERNAME",
        "STAFF_NAME"
      FROM (
        SELECT
          "al"."ID" AS "ID",
          "al"."STAFF_ID" AS "STAFF_ID",
          "al"."ACTION" AS "ACTION",
          "al"."MODEL" AS "MODEL",
          "al"."OBJECT_ID" AS "OBJECT_ID",
          "al"."CHANGES" AS "CHANGES",
          "al"."CREATED_AT" AS "CREATED_AT",
          "al"."IP" AS "IP",
          "al"."USER_AGENT" AS "USER_AGENT",
          "s"."USERNAME" AS "USERNAME",
          TRIM(CONCAT(COALESCE("p"."NAME", ''), ' ', COALESCE("p"."LAST_NAME", ''))) AS "STAFF_NAME"
        FROM "ACTIVITY_LOG" "al"
        INNER JOIN "STAFF" "s"
          ON "s"."STAFF_ID" = "al"."STAFF_ID"
        LEFT JOIN "PERSON" "p"
          ON "p"."PERSON_ID" = "s"."PERSON_ID"
      ) AS "activity_log_rows"
      ${whereClause}
      ORDER BY "CREATED_AT" DESC, "ID" DESC
    `

    const [data, metadata] = await paginatedQuery<ActivityLogRow>({
      statement,
      values,
      pagination,
    })

    return this.success({
      data: data.map((item) => this.mapRow(item)),
      metadata,
    })
  }

  @CatchServiceError()
  async getOne(activityLogId: number): Promise<ApiResponse<ActivityLogResponse>> {
    const statement = `
      SELECT
        "al"."ID" AS "ID",
        "al"."STAFF_ID" AS "STAFF_ID",
        "al"."ACTION" AS "ACTION",
        "al"."MODEL" AS "MODEL",
        "al"."OBJECT_ID" AS "OBJECT_ID",
        "al"."CHANGES" AS "CHANGES",
        "al"."CREATED_AT" AS "CREATED_AT",
        "al"."IP" AS "IP",
        "al"."USER_AGENT" AS "USER_AGENT",
        "s"."USERNAME" AS "USERNAME",
        TRIM(CONCAT(COALESCE("p"."NAME", ''), ' ', COALESCE("p"."LAST_NAME", ''))) AS "STAFF_NAME"
      FROM "ACTIVITY_LOG" "al"
      INNER JOIN "STAFF" "s"
        ON "s"."STAFF_ID" = "al"."STAFF_ID"
      LEFT JOIN "PERSON" "p"
        ON "p"."PERSON_ID" = "s"."PERSON_ID"
      WHERE "al"."ID" = $1
      LIMIT 1
    `

    const [row] = await queryRunner<ActivityLogRow>(statement, [activityLogId])

    if (!row) {
      throw new NotFoundError(
        `Registro de bitácora con id '${activityLogId}' no encontrado.`
      )
    }

    return this.success({ data: this.mapRow(row) })
  }

  private mapRow(row: ActivityLogRow): ActivityLogResponse {
    return {
      ID: Number(row.ID),
      STAFF_ID: Number(row.STAFF_ID),
      ACTION: row.ACTION || '',
      MODEL: row.MODEL || '',
      OBJECT_ID:
        row.OBJECT_ID === null || row.OBJECT_ID === undefined
          ? null
          : Number(row.OBJECT_ID),
      CHANGES: row.CHANGES || null,
      CREATED_AT: row.CREATED_AT ? new Date(row.CREATED_AT) : null,
      IP: row.IP || '',
      USER_AGENT: row.USER_AGENT || '',
      USERNAME: row.USERNAME || '',
      STAFF_NAME: row.STAFF_NAME || '',
    }
  }
}
