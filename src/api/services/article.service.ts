import { Repository, SelectQueryBuilder } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'
import { Article } from '@entity/Article'
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
import { paginate } from '@src/helpers/query-utils'

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
  STATE?: string
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
  STATE: string
  CREATED_AT?: Date | null
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

    const article = this.articleRepository.create({
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

    const saved = await this.articleRepository.save(article)

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

    await this.articleRepository.save(article)

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

    const qb = this.articleRepository
      .createQueryBuilder('a')
      .where('a.BUSINESS_ID = :businessId', { businessId })

    if (conditions.length) {
      this.applyConditions(qb, conditions)
    }

    qb.orderBy('"a"."ARTICLE_ID"', 'DESC')

    const { data, metadata } = await paginate(qb, pagination)
    const rows = data.map((item) => this.mapArticle(item))

    return this.success({ data: rows, metadata })
  }

  private async buildArticleResponse(
    articleId: number,
    businessId: number
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findOne({
      where: { ARTICLE_ID: articleId, BUSINESS_ID: businessId },
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
      STATE: article.STATE || 'A',
      CREATED_AT: article.CREATED_AT,
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

  private applyConditions(
    qb: SelectQueryBuilder<Article>,
    conditions: AdvancedCondition<Article>[]
  ): void {
    conditions.forEach((condition, index) => {
      const operator = (condition.operator || '').toUpperCase()
      const paramName = `param_${index}`

      if (String(condition.field).toUpperCase() === 'FILTER') {
        const search = `%${condition.value}%`
        qb.andWhere(
          `
            UPPER(unaccent("a"."CODE"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("a"."NAME"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("a"."ITEM_TYPE"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("a"."UNIT_MEASURE"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("a"."CATEGORY"::text)) LIKE UPPER(:${paramName})
            OR UPPER(unaccent("a"."DESCRIPTION"::text)) LIKE UPPER(:${paramName})
          `,
          { [paramName]: search }
        )
        return
      }

      const fields = Array.isArray(condition.field)
        ? condition.field.map((item) => String(item))
        : [String(condition.field)]
      const columns = fields.map((field) => this.resolveColumn(field))
      const expression =
        columns.length > 1 ? columns.join(` || ' ' || `) : columns[0]

      switch (operator) {
        case '=':
        case '!=':
        case '<':
        case '<=':
        case '>':
        case '>=':
          qb.andWhere(`${expression} ${operator} :${paramName}`, {
            [paramName]: condition.value,
          })
          break
        case 'LIKE':
          qb.andWhere(
            `UPPER(unaccent(${expression}::text)) LIKE UPPER(:${paramName})`,
            {
              [paramName]: `%${condition.value}%`,
            }
          )
          break
        case 'IN':
        case 'NOT IN':
          if (!Array.isArray(condition.value)) {
            throw new BadRequestError(
              `El operador '${operator}' requiere un arreglo de valores.`
            )
          }
          qb.andWhere(`${columns[0]} ${operator} (:...${paramName})`, {
            [paramName]: condition.value,
          })
          break
        case 'BETWEEN':
          if (!Array.isArray(condition.value) || condition.value.length !== 2) {
            throw new BadRequestError(
              "El operador 'BETWEEN' requiere exactamente dos valores."
            )
          }
          qb.andWhere(
            `${columns[0]} BETWEEN :${paramName}_start AND :${paramName}_end`,
            {
              [`${paramName}_start`]: condition.value[0],
              [`${paramName}_end`]: condition.value[1],
            }
          )
          break
        case 'IS NULL':
          qb.andWhere(`${columns[0]} IS NULL`)
          break
        case 'IS NOT NULL':
          qb.andWhere(`${columns[0]} IS NOT NULL`)
          break
        default:
          throw new BadRequestError(
            `Operador '${condition.operator}' no soportado.`
          )
      }
    })
  }

  private resolveColumn(field: string): string {
    const normalized = field.toUpperCase()
    return `"a"."${normalized}"`
  }
}
