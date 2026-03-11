import { Repository } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'
import { Article } from '@entity/Article'
import { ArticleCompatibility } from '@entity/ArticleCompatibility'
import { Vehicle } from '@entity/Vehicle'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import {
  BadRequestError,
  DbConflictError,
  NotFoundError,
} from '@api/errors/http.error'
import { paginatedQuery } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'

type ArticlePayload = {
  ARTICLE_ID?: number
  CODE?: string
  NAME?: string
  ITEM_TYPE?: string
  UNIT_MEASURE?: string
  CATEGORY?: string | null
  MIN_STOCK?: number | null
  MAX_STOCK?: number | null
  CURRENT_STOCK?: number | null
  COST_REFERENCE?: number | null
  DESCRIPTION?: string | null
  COMPATIBILITIES?: Array<{
    BRAND: string
    MODEL: string
    YEAR_FROM?: number | null
    YEAR_TO?: number | null
    ENGINE?: string | null
    NOTES?: string | null
  }>
  STATE?: string
}

type ArticleCompatibilityResponse = {
  ARTICLE_COMPATIBILITY_ID: number
  BRAND: string
  MODEL: string
  YEAR_FROM: number | null
  YEAR_TO: number | null
  ENGINE: string
  NOTES: string
}

export type ArticleResponse = {
  ARTICLE_ID: number
  CODE: string
  NAME: string
  ITEM_TYPE: string
  UNIT_MEASURE: string
  CATEGORY: string
  MIN_STOCK: number
  MAX_STOCK: number | null
  CURRENT_STOCK: number
  COST_REFERENCE: number | null
  DESCRIPTION: string
  COMPATIBILITY_COUNT: number
  COMPATIBILITIES?: ArticleCompatibilityResponse[]
  STATE: string
  CREATED_AT?: Date | null
}

type ArticlePaginationRow = {
  ARTICLE_ID: number | string
  CODE: string | null
  NAME: string | null
  ITEM_TYPE: string | null
  UNIT_MEASURE: string | null
  CATEGORY: string | null
  MIN_STOCK: number | string | null
  MAX_STOCK: number | string | null
  CURRENT_STOCK: number | string | null
  COST_REFERENCE: number | string | null
  DESCRIPTION: string | null
  COMPATIBILITY_COUNT: number | string | null
  STATE: string | null
  CREATED_AT: Date | null
}

export class ArticleService extends BaseService {
  private articleRepository: Repository<Article>

  constructor() {
    super()
    this.articleRepository = this.datasource.getRepository(Article)
  }

  @CatchServiceError()
  async create(
    payload: ArticlePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ArticleResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const code = this.normalizeCode(payload.CODE, true)
    const name = this.normalizeRequiredText(payload.NAME, 'NAME')
    const minStock = this.normalizeNonNegativeNumber(payload.MIN_STOCK, 0)
    const maxStock = this.normalizeNonNegativeNumber(payload.MAX_STOCK, null)
    const currentStock = this.normalizeNonNegativeNumber(payload.CURRENT_STOCK, 0)
    const costReference = this.normalizeNonNegativeNumber(
      payload.COST_REFERENCE,
      null
    )

    this.assertStockRange(minStock, maxStock)
    await this.assertUniqueCode(businessId, code)

    const compatibilities = this.normalizeCompatibilities(
      payload.COMPATIBILITIES || []
    )

    const saved = await this.datasource.transaction(async (manager) => {
      const article = manager.getRepository(Article).create({
        BUSINESS_ID: businessId,
        CODE: code,
        NAME: name,
        ITEM_TYPE: this.normalizeRequiredText(
          payload.ITEM_TYPE || 'REPUESTO',
          'ITEM_TYPE'
        ),
        UNIT_MEASURE: this.normalizeRequiredText(
          payload.UNIT_MEASURE || 'UND',
          'UNIT_MEASURE'
        ),
        CATEGORY: payload.CATEGORY?.trim() || null,
        MIN_STOCK: minStock,
        MAX_STOCK: maxStock,
        CURRENT_STOCK: currentStock,
        COST_REFERENCE: costReference,
        DESCRIPTION: payload.DESCRIPTION?.trim() || null,
        STATE: payload.STATE || 'A',
        CREATED_BY: sessionInfo.userId,
      })

      const savedArticle = await manager.getRepository(Article).save(article)
      await this.replaceCompatibilities(
        manager,
        savedArticle.ARTICLE_ID,
        compatibilities,
        sessionInfo.userId
      )
      return savedArticle
    })

    return this.success({
      data: await this.buildArticleResponse(saved.ARTICLE_ID, businessId),
    })
  }

  @CatchServiceError()
  async update(
    payload: ArticlePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<ArticleResponse>> {
    const articleId = Number(payload.ARTICLE_ID)

    if (!articleId) {
      throw new BadRequestError('El campo ARTICLE_ID es requerido.')
    }

    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const article = await this.articleRepository.findOne({
      where: { ARTICLE_ID: articleId, BUSINESS_ID: businessId },
    })

    if (!article) {
      throw new NotFoundError(`Articulo con id '${articleId}' no encontrado.`)
    }

    const code =
      payload.CODE !== undefined
        ? this.normalizeCode(payload.CODE, true)
        : article.CODE

    await this.assertUniqueCode(businessId, code, articleId)

    const minStock =
      payload.MIN_STOCK !== undefined
        ? this.normalizeNonNegativeNumber(payload.MIN_STOCK, 0)
        : this.toNumber(article.MIN_STOCK)
    const maxStock =
      payload.MAX_STOCK !== undefined
        ? this.normalizeNonNegativeNumber(payload.MAX_STOCK, null)
        : article.MAX_STOCK === null
        ? null
        : this.toNumber(article.MAX_STOCK)

    this.assertStockRange(minStock, maxStock)
    const compatibilities =
      payload.COMPATIBILITIES !== undefined
        ? this.normalizeCompatibilities(payload.COMPATIBILITIES)
        : undefined

    if (payload.CODE !== undefined) article.CODE = code
    if (payload.NAME !== undefined) {
      article.NAME = this.normalizeRequiredText(payload.NAME, 'NAME')
    }
    if (payload.ITEM_TYPE !== undefined) {
      article.ITEM_TYPE = this.normalizeRequiredText(
        payload.ITEM_TYPE,
        'ITEM_TYPE'
      )
    }
    if (payload.UNIT_MEASURE !== undefined) {
      article.UNIT_MEASURE = this.normalizeRequiredText(
        payload.UNIT_MEASURE,
        'UNIT_MEASURE'
      )
    }
    if (payload.CATEGORY !== undefined) {
      article.CATEGORY = payload.CATEGORY?.trim() || null
    }
    if (payload.MIN_STOCK !== undefined) {
      article.MIN_STOCK = minStock
    }
    if (payload.MAX_STOCK !== undefined) {
      article.MAX_STOCK = maxStock
    }
    if (payload.CURRENT_STOCK !== undefined) {
      article.CURRENT_STOCK = this.normalizeNonNegativeNumber(
        payload.CURRENT_STOCK,
        0
      )
    }
    if (payload.COST_REFERENCE !== undefined) {
      article.COST_REFERENCE = this.normalizeNonNegativeNumber(
        payload.COST_REFERENCE,
        null
      )
    }
    if (payload.DESCRIPTION !== undefined) {
      article.DESCRIPTION = payload.DESCRIPTION?.trim() || null
    }
    if (payload.STATE) {
      article.STATE = payload.STATE
    }

    article.UPDATED_BY = sessionInfo.userId

    await this.datasource.transaction(async (manager) => {
      await manager.getRepository(Article).save(article)

      if (compatibilities !== undefined) {
        await this.replaceCompatibilities(
          manager,
          article.ARTICLE_ID,
          compatibilities,
          sessionInfo.userId
        )
      }
    })

    return this.success({
      data: await this.buildArticleResponse(article.ARTICLE_ID, businessId),
    })
  }

  @CatchServiceError()
  async getOne(articleId: number): Promise<ApiResponse<ArticleResponse>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID

    return this.success({
      data: await this.buildArticleResponse(articleId, businessId),
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<Article>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<ArticleResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const normalizedConditions = preparePaginationConditions(conditions, [
      'CODE',
      'NAME',
      'ITEM_TYPE',
      'UNIT_MEASURE',
      'CATEGORY',
      'DESCRIPTION',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "ARTICLE_ID",
        "CODE",
        "NAME",
        "ITEM_TYPE",
        "UNIT_MEASURE",
        "CATEGORY",
        "MIN_STOCK",
        "MAX_STOCK",
        "CURRENT_STOCK",
        "COST_REFERENCE",
        "DESCRIPTION",
        "COMPATIBILITY_COUNT",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "a"."ARTICLE_ID" AS "ARTICLE_ID",
          "a"."CODE" AS "CODE",
          "a"."NAME" AS "NAME",
          "a"."ITEM_TYPE" AS "ITEM_TYPE",
          "a"."UNIT_MEASURE" AS "UNIT_MEASURE",
          "a"."CATEGORY" AS "CATEGORY",
          "a"."MIN_STOCK" AS "MIN_STOCK",
          "a"."MAX_STOCK" AS "MAX_STOCK",
          "a"."CURRENT_STOCK" AS "CURRENT_STOCK",
          "a"."COST_REFERENCE" AS "COST_REFERENCE",
          "a"."DESCRIPTION" AS "DESCRIPTION",
          (
            SELECT COUNT(*)
            FROM "ARTICLE_COMPATIBILITY" "ac"
            WHERE "ac"."ARTICLE_ID" = "a"."ARTICLE_ID"
          ) AS "COMPATIBILITY_COUNT",
          "a"."STATE" AS "STATE",
          "a"."CREATED_AT" AS "CREATED_AT"
        FROM "ARTICLE" "a"
        WHERE "a"."BUSINESS_ID" = ${Number(businessId)}
      ) AS "article_rows"
      ${whereClause}
      ORDER BY "ARTICLE_ID" DESC
    `

    const [data, metadata] = await paginatedQuery<ArticlePaginationRow>({
      statement,
      values,
      pagination,
    })
    const rows = data.map((item) => this.mapPaginatedArticleRow(item))

    return this.success({ data: rows, metadata })
  }

  @CatchServiceError()
  async getCompatibleByVehicle(
    vehicleId: number
  ): Promise<ApiResponse<ArticleResponse[]>> {
    const businessId = (await this.getBusinessInfo(['BUSINESS_ID'])).BUSINESS_ID
    const vehicle = await this.datasource.getRepository(Vehicle).findOne({
      where: { VEHICLE_ID: vehicleId, BUSINESS_ID: businessId, STATE: 'A' },
    })

    if (!vehicle) {
      throw new NotFoundError(`Vehiculo con id '${vehicleId}' no encontrado.`)
    }

    const qb = this.articleRepository
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.COMPATIBILITIES', 'ac')
      .where('a.BUSINESS_ID = :businessId', { businessId })
      .andWhere('a.STATE = :state', { state: 'A' })
      .andWhere('UPPER(unaccent(ac.BRAND)) = UPPER(unaccent(:brand))', {
        brand: vehicle.BRAND,
      })
      .andWhere('UPPER(unaccent(ac.MODEL)) = UPPER(unaccent(:model))', {
        model: vehicle.MODEL,
      })
      .orderBy(
        'CASE WHEN "a"."CURRENT_STOCK" > 0 THEN 1 ELSE 0 END',
        'DESC'
      )
      .addOrderBy('"a"."CURRENT_STOCK"', 'DESC')
      .addOrderBy('"a"."NAME"', 'ASC')

    if (vehicle.YEAR !== null && vehicle.YEAR !== undefined) {
      qb.andWhere('(ac.YEAR_FROM IS NULL OR ac.YEAR_FROM <= :year)', {
        year: vehicle.YEAR,
      })
      qb.andWhere('(ac.YEAR_TO IS NULL OR ac.YEAR_TO >= :year)', {
        year: vehicle.YEAR,
      })
    }

    if (vehicle.ENGINE) {
      qb.andWhere(
        `(ac.ENGINE IS NULL OR TRIM(ac.ENGINE) = '' OR UPPER(unaccent(ac.ENGINE)) = UPPER(unaccent(:engine)))`,
        {
          engine: vehicle.ENGINE,
        }
      )
    }

    const articles = await qb.getMany()

    return this.success({
      data: articles.map((item) => this.mapArticle(item)),
    })
  }

  private async buildArticleResponse(
    articleId: number,
    businessId: number
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findOne({
      where: { ARTICLE_ID: articleId, BUSINESS_ID: businessId },
      relations: ['COMPATIBILITIES'],
    })

    if (!article) {
      throw new NotFoundError(`Articulo con id '${articleId}' no encontrado.`)
    }

    return this.mapArticle(article)
  }

  private mapArticle(article: Article): ArticleResponse {
    return {
      ARTICLE_ID: article.ARTICLE_ID,
      CODE: article.CODE || '',
      NAME: article.NAME || '',
      ITEM_TYPE: article.ITEM_TYPE || '',
      UNIT_MEASURE: article.UNIT_MEASURE || '',
      CATEGORY: article.CATEGORY || '',
      MIN_STOCK: this.toNumber(article.MIN_STOCK),
      MAX_STOCK:
        article.MAX_STOCK === null ? null : this.toNumber(article.MAX_STOCK),
      CURRENT_STOCK: this.toNumber(article.CURRENT_STOCK),
      COST_REFERENCE:
        article.COST_REFERENCE === null
          ? null
          : this.toNumber(article.COST_REFERENCE),
      DESCRIPTION: article.DESCRIPTION || '',
      COMPATIBILITY_COUNT: Number(
        article.COMPATIBILITY_COUNT ?? article.COMPATIBILITIES?.length ?? 0
      ),
      COMPATIBILITIES: (article.COMPATIBILITIES || [])
        .sort(
          (a, b) =>
            a.ARTICLE_COMPATIBILITY_ID - b.ARTICLE_COMPATIBILITY_ID
        )
        .map((item) => ({
          ARTICLE_COMPATIBILITY_ID: item.ARTICLE_COMPATIBILITY_ID,
          BRAND: item.BRAND || '',
          MODEL: item.MODEL || '',
          YEAR_FROM: item.YEAR_FROM ?? null,
          YEAR_TO: item.YEAR_TO ?? null,
          ENGINE: item.ENGINE || '',
          NOTES: item.NOTES || '',
        })),
      STATE: article.STATE || 'A',
      CREATED_AT: article.CREATED_AT,
    }
  }

  private mapPaginatedArticleRow(article: ArticlePaginationRow): ArticleResponse {
    return {
      ARTICLE_ID: Number(article.ARTICLE_ID),
      CODE: article.CODE || '',
      NAME: article.NAME || '',
      ITEM_TYPE: article.ITEM_TYPE || '',
      UNIT_MEASURE: article.UNIT_MEASURE || '',
      CATEGORY: article.CATEGORY || '',
      MIN_STOCK:
        article.MIN_STOCK === null || article.MIN_STOCK === undefined
          ? 0
          : this.toNumber(article.MIN_STOCK),
      MAX_STOCK:
        article.MAX_STOCK === null || article.MAX_STOCK === undefined
          ? null
          : this.toNumber(article.MAX_STOCK),
      CURRENT_STOCK:
        article.CURRENT_STOCK === null || article.CURRENT_STOCK === undefined
          ? 0
          : this.toNumber(article.CURRENT_STOCK),
      COST_REFERENCE:
        article.COST_REFERENCE === null || article.COST_REFERENCE === undefined
          ? null
          : this.toNumber(article.COST_REFERENCE),
      DESCRIPTION: article.DESCRIPTION || '',
      COMPATIBILITY_COUNT:
        article.COMPATIBILITY_COUNT === null ||
        article.COMPATIBILITY_COUNT === undefined
          ? 0
          : Number(article.COMPATIBILITY_COUNT),
      STATE: article.STATE || 'A',
      CREATED_AT: article.CREATED_AT || null,
    }
  }

  private normalizeCode(value?: string, required = false): string {
    const normalized = value?.trim().toUpperCase() || ''

    if (required && !normalized) {
      throw new BadRequestError('El campo CODE es requerido.')
    }

    return normalized
  }

  private normalizeRequiredText(value?: string, fieldName = 'CAMPO'): string {
    const normalized = value?.trim() || ''

    if (!normalized) {
      throw new BadRequestError(`El campo ${fieldName} es requerido.`)
    }

    return normalized
  }

  private normalizeCompatibilities(
    compatibilities: ArticlePayload['COMPATIBILITIES'] = []
  ) {
    return compatibilities.map((item, index) => {
      const brand = this.normalizeRequiredText(item.BRAND, `COMPATIBILITIES[${index}].BRAND`)
      const model = this.normalizeRequiredText(item.MODEL, `COMPATIBILITIES[${index}].MODEL`)
      const yearFrom =
        item.YEAR_FROM === undefined || item.YEAR_FROM === null
          ? null
          : this.normalizeYear(item.YEAR_FROM, `COMPATIBILITIES[${index}].YEAR_FROM`)
      const yearTo =
        item.YEAR_TO === undefined || item.YEAR_TO === null
          ? null
          : this.normalizeYear(item.YEAR_TO, `COMPATIBILITIES[${index}].YEAR_TO`)

      if (
        yearFrom !== null &&
        yearTo !== null &&
        Number(yearTo) < Number(yearFrom)
      ) {
        throw new BadRequestError(
          'YEAR_TO no puede ser menor que YEAR_FROM en la compatibilidad.'
        )
      }

      return {
        BRAND: brand,
        MODEL: model,
        YEAR_FROM: yearFrom,
        YEAR_TO: yearTo,
        ENGINE: item.ENGINE?.trim() || null,
        NOTES: item.NOTES?.trim() || null,
      }
    })
  }

  private normalizeYear(value: number, fieldName: string): number {
    const year = Number(value)

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new BadRequestError(`${fieldName} debe estar entre 1900 y 2100.`)
    }

    return year
  }

  private async replaceCompatibilities(
    manager: any,
    articleId: number,
    compatibilities: ReturnType<ArticleService['normalizeCompatibilities']>,
    userId: number
  ): Promise<void> {
    const repo = manager.getRepository(ArticleCompatibility)
    await repo.delete({ ARTICLE_ID: articleId })

    if (!compatibilities.length) return

    await repo.save(
      compatibilities.map((item) =>
        repo.create({
          ARTICLE_ID: articleId,
          BRAND: item.BRAND,
          MODEL: item.MODEL,
          YEAR_FROM: item.YEAR_FROM,
          YEAR_TO: item.YEAR_TO,
          ENGINE: item.ENGINE,
          NOTES: item.NOTES,
          CREATED_BY: userId,
          STATE: 'A',
        })
      )
    )
  }

  private normalizeNonNegativeNumber(
    value: number | null | undefined,
    defaultValue: number | null
  ): number | null {
    if (value === undefined || value === null || value === ('' as never)) {
      return defaultValue
    }

    const normalized = Number(value)

    if (!Number.isFinite(normalized) || normalized < 0) {
      throw new BadRequestError('Los valores numericos deben ser >= 0.')
    }

    return Number(normalized.toFixed(2))
  }

  private assertStockRange(minStock: number | null, maxStock: number | null): void {
    if (maxStock === null) {
      return
    }

    if (minStock !== null && maxStock < minStock) {
      throw new BadRequestError(
        'MAX_STOCK no puede ser menor que MIN_STOCK.'
      )
    }
  }

  private toNumber(value: unknown): number {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
      return 0
    }
    return Number(numeric.toFixed(2))
  }

  private async assertUniqueCode(
    businessId: number,
    code: string,
    currentArticleId?: number
  ): Promise<void> {
    const qb = this.articleRepository
      .createQueryBuilder('a')
      .where('a.BUSINESS_ID = :businessId', { businessId })
      .andWhere('UPPER(a.CODE) = UPPER(:code)', { code })

    if (currentArticleId) {
      qb.andWhere('a.ARTICLE_ID != :currentArticleId', { currentArticleId })
    }

    const exists = await qb.getOne()
    if (exists) {
      throw new DbConflictError(`El codigo '${code}' ya esta registrado.`)
    }
  }

}
