import { preparePostgresQuery } from '@src/api/middlewares/prepare-postgres-query'
import {
  DEFAULT_PAGINATION_PAGE_NUMBER,
  DEFAULT_PAGINATION_PAGE_SIZE,
} from '@src/constants/general'
import { AppDataSource } from '@src/data-source'
import {
  Metadata,
  Pagination,
  PaginationLinks,
  QueryParam,
} from '@src/types/api.types'
import { SelectQueryBuilder } from 'typeorm'

export const ORA_DATETIME_FORMAT = 'YYYY-MM-DD HH24:MI:SS.MS'
export const ORA_DATE_FORMAT = 'YYYY-MM-DD'

/**
 * Generates an Oracle `TO_DATE` SQL expression to convert a string into a valid date.
 * Automatically formats ISO date strings to 'YYYY-MM-DD'.
 *
 * @param date - The date string to be converted (e.g., '2025-10-01T04:00:00.000Z').
 * @param format - The date format to use (default: 'YYYY-MM-DD').
 * @returns A SQL string using `TO_DATE` with the provided date and format.
 *
 * @example
 * to_date('2025-10-01T04:00:00.000Z');
 * // Returns: "TO_DATE('2025-10-01', 'YYYY-MM-DD')"
 */
export const to_date = (
  placeholder: unknown,
  format = 'YYYY-MM-DD'
): string => {
  // const formattedDate = new Date(date).toISOString().slice(0, 10) // Extracts 'YYYY-MM-DD'
  return `TO_DATE($${placeholder}, '${format}')`
}

/**
 * Generates an Oracle SQL expression to normalize a text field by removing accents.
 *
 * This function uses `TRANSLATE` to replace accented characters with their non-accented equivalents
 * and `UPPER` to convert the text to uppercase.
 *
 * @param field - The database field to apply the transformation.
 * @returns A SQL string that applies `TRANSLATE` and `UPPER` to the given field.
 *
 * @example
 * translate('nombre');
 * // Returns: "UPPER(TRANSLATE(nombre, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'))"
 *
 * @example
 * translate('acción');
 * // Returns: "UPPER(TRANSLATE(action, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'))"
 */

export const translate = (
  field: string,
  type: 'text' | 'date' = 'text'
): string => {
  return type === 'date' ? `${field}` : `UPPER(unaccent(${field}::text))`
}

/**
 * This function takes a sql query and extracts the params inside the query.
 * @param query - The SQL query to extract the params from.
 * @returns An array of params extracted from the query.
 * @example
 * extractParams('SELECT * FROM users WHERE age > :min_age AND name = :name') // ['min_age', 'name']
 *
 */
export const extractQueryParams = (query: string): string[] => {
  const cleanedQuery = query?.replace(/\/\*[\s\S]*?\*\/|--.*/g, '')?.trim()
  const params: string[] = cleanedQuery?.match(/:([a-zA-Z0-9_]+)/g) || []
  return params.map((param) => param?.replace(':', ''))
}

/**
 * Get the parameters from a query string end return an object with the parameters.
 * El valor de de para los parámetros los obtiene de la sesión que se para como parámetro,
 * si un parametro en la consulta no esta en la sesión debería arrojar una excepción.
 *
 * @param statement - the query string
 * @param session - SessionInfo
 * @param validate - If true, validate the parameters against the session. If false, ignore the validation. Default is true.
 * @returns An object with the parameters. and the query
 *
 * @example
 * getParamsFromSession('SELECT * FROM users WHERE age > :min_age AND name = :NAME', session) // { min_age: 25, name: 'John' }
 */
export const getParamsFromSession = (
  statement: string,
  session: Record<string, string>,
  validate = true
): { query: string; params: Record<string, unknown> } => {
  const params =
    extractQueryParams(statement)?.map((param) => param.toLowerCase()) || []

  if (!params.length) {
    return { query: statement ?? '', params: {} }
  }

  const sessionLowerCase = Object.keys(session).reduce(
    (acc, key) => {
      acc[key.toLowerCase()] = session[key]
      return acc
    },
    {} as Record<string, string>
  )

  const invalidParams = params.filter(
    (param) => !Object.prototype.hasOwnProperty.call(sessionLowerCase, param)
  )

  if (invalidParams.length > 0 && validate) {
    throw new Error(
      `The following parameters are not allowed: ${invalidParams.join(', ')}.
      Allowed parameters: ${Object.keys(session).join(', ')}.
      Please review your query.`
    )
  }

  const values = params.reduce(
    (acc, param) => {
      acc[param] = sessionLowerCase[param]
      return acc
    },
    {} as Record<string, unknown>
  )

  const modifiedQuery = statement?.replace(
    /:([a-zA-Z0-9_]+)/g,
    (match, p1) => `:${p1.toLowerCase()}`
  )

  return { query: modifiedQuery, params: values }
}

const generateUrl = (queryParams: QueryParam): string => {
  const params = Object.entries(queryParams).map(
    ([key, value]) => `${key}=${value}`
  )

  return `?${params.join('&')}`
}

const getPreviousPageUrl = (queryParams: QueryParam): string => {
  return generateUrl({
    ...queryParams,
    page: String(Number(queryParams.page) - 1),
  })
}

const getNextPageUrl = (queryParams: QueryParam): string => {
  return generateUrl({ ...queryParams, page: queryParams.page + 1 })
}

/**
 * Run a query and return the result
 * @param statement SQL statement
 * @returns Result of the query
 */
export async function queryRunner<T = unknown>(
  statement: string,
  params?: Record<string, unknown> | unknown[]
): Promise<T[]> {
  const result = await AppDataSource.query(statement, params as never)

  return result || []
}

const getPaginationLinks = (
  totalPages: number,
  pagination: Pagination
): PaginationLinks => {
  const { page: pageNumber } = pagination
  const hasNextPage = pageNumber < totalPages
  const hasPreviousPage =
    pageNumber > DEFAULT_PAGINATION_PAGE_NUMBER && pageNumber <= totalPages

  return {
    nextPage: hasNextPage
      ? getNextPageUrl({
          page: String(pagination.page),
          size: String(pagination.size),
        })
      : null,
    previousPage: hasPreviousPage
      ? getPreviousPageUrl({
          page: String(pagination.page),
          size: String(pagination.size),
        })
      : null,
  }
}

export const getQueryMetadata = (
  resultCount: number,
  totalPages: number,
  pagination: Pagination,
  totalRows: number
): Metadata => {
  const { page: pageNumber, size: pageSize } = pagination

  return {
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalRows,
      pageSize,
      count: resultCount,
      links: getPaginationLinks(totalPages, pagination),
    },
  }
}

interface PaginatedQueryProps<T> {
  statement: SelectQueryBuilder<T> | string
  values: unknown[]
  pagination: Pagination
}

export const paginatedQuery = async <T>(
  props: PaginatedQueryProps<T>
): Promise<[T[], Metadata]> => {
  const { statement, values, pagination } = props
  const {
    page: pageNumber = DEFAULT_PAGINATION_PAGE_NUMBER,
    size: pageSize = DEFAULT_PAGINATION_PAGE_SIZE,
  } = pagination

  const offset = Number(pageSize) * (Number(pageNumber) - 1)

  const mainQuerySql =
    typeof statement === 'string' ? statement : statement.getSql()

  // Consulta paginada
  const paginatedQuerySql = `
    ${mainQuerySql}
    LIMIT ${pageSize} OFFSET ${offset}
  `

  // Consulta para contar resultados totales (sin LIMIT/OFFSET)
  const countQuerySql = `
    SELECT COUNT(*) AS "ROWCOUNT" FROM (${mainQuerySql}) AS subquery
  `

  // Ejecutar consulta paginada
  const result = await queryRunner<T>(paginatedQuerySql, values)

  // Ejecutar consulta de conteo
  const [{ ROWCOUNT = 0 }] = await queryRunner<{ ROWCOUNT: number }>(
    countQuerySql,
    values // usamos los mismos valores de la consulta principal
  )

  const totalPages = Math.ceil(ROWCOUNT / pageSize)
  const meta = getQueryMetadata(result.length, totalPages, pagination, ROWCOUNT)

  return [result, meta]
}

export async function paginate<T>(
  qb: SelectQueryBuilder<T>,
  pagination: Pagination
): Promise<{ data: T[]; metadata: Metadata }> {
  const { page, size, order = 'ASC', orderBy } = pagination

  if (orderBy) {
    qb.orderBy(orderBy, order)
  }

  const [data, totalRows] = await qb
    .skip((page - 1) * size)
    .take(size)
    .getManyAndCount()

  const totalPages = Math.ceil(totalRows / size)
  const count = data.length

  const buildLink = (pageNum: number): string => {
    const url = new URL('/', 'http://localhost:3000')
    url.searchParams.set('page', String(pageNum))
    url.searchParams.set('pageSize', String(size))
    if (orderBy) url.searchParams.set('orderBy', orderBy)
    if (order) url.searchParams.set('order', order)
    return url.pathname + url.search
  }

  const links = {
    first: buildLink(1),
    previous: page > 1 ? buildLink(page - 1) : null,
    next: page < totalPages ? buildLink(page + 1) : null,
    last: buildLink(totalPages),
  }

  return {
    data,
    metadata: {
      pagination: {
        currentPage: page,
        totalPages,
        totalRows,
        pageSize: size,
        count,
        links,
      },
    },
  }
}
