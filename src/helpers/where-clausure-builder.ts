import { format } from 'util'
import {
  CONDITION_FIELD_VALUE_ERROR_MESSAGE,
  INVALID_ARRAY_VALUE_FOR_OPERATOR,
  INVALID_DATA_TYPE_FOR_CONDITION,
  INVALIDA_DATA_TYPE_ERROR_MESSAGE,
  UNSUPPORTED_OPERATOR_ERROR_MESSAGE,
} from '../constants/messages'
import { sanitizeValue } from './sanitize-value'
import { to_date, translate } from './query-utils'
import { detectSQLInjection } from './detect-sql-injection'
import { isValidDate } from './is-valid-date'
import { QueryValidationError } from '@src/api/errors/http.error'
import { AdvancedCondition } from '@src/types/api.types'

const buildSQLCondition = (
  field: string,
  operator: string,
  placeholder: string
): string => ` AND ${translate(field)} ${operator} ${placeholder}`

interface QueryBuilderReturn {
  whereClause: string
  values: unknown[]
}

type ComparisonMode = 'text' | 'date' | 'raw'

export function whereClauseBuilder(
  conditions: AdvancedCondition<Record<string, unknown>>[]
): QueryBuilderReturn {
  const allowedOperators = [
    '!=',
    '<',
    '<=',
    '<>',
    '=',
    '>',
    '>=',
    'BETWEEN',
    'IN',
    'IS NULL',
    'LIKE',
    'NOT IN',
  ]

  let whereClause = 'WHERE 1 = 1'
  const values: unknown[] = []
  let paramIndex = 1

  const quoteIdentifier = (identifier: string): string => {
    return `"${identifier.replace(/"/g, '')}"`
  }

  const resolveComparisonMode = (
    field: string | string[],
    operator: string,
    value: unknown
  ): ComparisonMode => {
    if (Array.isArray(field)) {
      return 'text'
    }

    if (operator === 'LIKE') {
      return 'text'
    }

    if (Array.isArray(value)) {
      const sanitizedValues = value.map((item) => sanitizeValue(item))

      if (sanitizedValues.every((item) => isValidDate(item))) {
        return 'date'
      }

      if (
        sanitizedValues.every((item) =>
          ['number', 'boolean'].includes(typeof item)
        )
      ) {
        return 'raw'
      }

      return 'text'
    }

    const sanitizedValue = sanitizeValue(value)

    if (isValidDate(sanitizedValue)) {
      return 'date'
    }

    if (['number', 'boolean'].includes(typeof sanitizedValue)) {
      return 'raw'
    }

    return 'text'
  }

  const quoteField = (
    field: string | string[],
    mode: ComparisonMode = 'text'
  ): string => {
    if (Array.isArray(field)) {
      return field
        .map((f) => `COALESCE(${translate(quoteIdentifier(f), 'text')}, '')`)
        .join(" || ' ' || ")
    }
    if (mode === 'raw' || mode === 'date') {
      return quoteIdentifier(field)
    }
    return translate(quoteIdentifier(field), 'text')
  }

  conditions.forEach((condition) => {
    const { operator, value } = condition
    const comparisonMode = resolveComparisonMode(condition.field, operator, value)

    const fieldExpr = quoteField(condition.field, comparisonMode)

    const suspicious = detectSQLInjection(value)
    if (suspicious?.length) {
      throw new QueryValidationError(suspicious)
    }

    if (
      !condition.field ||
      !operator ||
      (value === undefined && value === null && typeof value !== 'boolean')
    ) {
      throw new QueryValidationError(CONDITION_FIELD_VALUE_ERROR_MESSAGE)
    }

    if (!allowedOperators.includes(operator)) {
      throw new QueryValidationError(
        format(
          UNSUPPORTED_OPERATOR_ERROR_MESSAGE,
          operator,
          allowedOperators.join(', ')
        )
      )
    }

    switch (operator) {
      case '!=':
      case '<>':
      case '<':
      case '<=':
      case '=':
      case '>=':
      case '>': {
        if (
          !['string', 'number'].includes(typeof value) &&
          !isValidDate(value)
        ) {
          throw new QueryValidationError(
            format(
              INVALIDA_DATA_TYPE_ERROR_MESSAGE,
              typeof value,
              operator,
              'string, number, or date'
            )
          )
        }

        const isDate = comparisonMode === 'date'
        const placeholder = isDate ? to_date(paramIndex) : `$${paramIndex}`

        whereClause += ` AND ${fieldExpr} ${operator} ${placeholder}`
        values.push(
          sanitizeValue(
            comparisonMode === 'text' && typeof value === 'string'
              ? value.toUpperCase()
              : value
          )
        )
        paramIndex++
        break
      }

      case 'IS NULL': {
        if (typeof value !== 'boolean') {
          throw new QueryValidationError(
            format(
              INVALIDA_DATA_TYPE_ERROR_MESSAGE,
              typeof value,
              operator,
              'boolean'
            )
          )
        }

        whereClause += value
          ? ` AND ${fieldExpr} IS NULL`
          : ` AND ${fieldExpr} IS NOT NULL`
        break
      }

      case 'IN':
      case 'NOT IN': {
        if (!Array.isArray(value)) {
          throw new QueryValidationError(
            format(INVALID_ARRAY_VALUE_FOR_OPERATOR, operator)
          )
        }

        const placeholders = value.map(() => `$${paramIndex++}`)
        whereClause += ` AND ${fieldExpr} ${operator} (${placeholders.join(
          ', '
        )})`

        placeholders.forEach((_, i) => {
          values.push(
            sanitizeValue(
              comparisonMode === 'text' && typeof value[i] === 'string'
                ? value[i].toUpperCase()
                : value[i]
            )
          )
        })
        break
      }

      case 'BETWEEN': {
        if (!Array.isArray(value) || value.length !== 2) {
          throw new QueryValidationError(
            'Expected an array of two values for BETWEEN'
          )
        }

        const [startRaw, endRaw] = value
        const start = sanitizeValue(startRaw)
        const end = sanitizeValue(endRaw)

        const isDateRange = comparisonMode === 'date'

        // Detecta si es ISO con tiempo (YYYY-MM-DDTHH:mm:ss.SSSZ)
        const isISO = (v: unknown) =>
          typeof v === 'string' && /\d{4}-\d{2}-\d{2}T/.test(v)

        const castFrom = isDateRange
          ? isISO(start)
            ? '::timestamptz'
            : '::date'
          : ''
        const castTo = isDateRange
          ? isISO(end)
            ? '::timestamptz'
            : '::date'
          : ''

        const fromExpr = `$${paramIndex}${castFrom}`
        // Si es fecha, NO conviertas a uppercase
        values.push(
          isDateRange
            ? start
            : comparisonMode === 'text' && typeof start === 'string'
              ? start.toUpperCase()
              : start
        )
        paramIndex++

        const toExpr = `$${paramIndex}${castTo}`
        values.push(
          isDateRange
            ? end
            : comparisonMode === 'text' && typeof end === 'string'
              ? end.toUpperCase()
              : end
        )
        paramIndex++

        whereClause += ` AND ${fieldExpr} BETWEEN ${fromExpr} AND ${toExpr}`
        break
      }

      case 'LIKE': {
        if (
          (typeof value !== 'string' && typeof value !== 'number') ||
          isValidDate(value)
        ) {
          throw new QueryValidationError(
            format(
              INVALIDA_DATA_TYPE_ERROR_MESSAGE,
              typeof value,
              operator,
              'string or number'
            )
          )
        }

        const searchValue = `%${sanitizeValue(
          `${value}`.replace(/%/g, ' ').trim()
        )}%`
        whereClause += ` AND ${fieldExpr} LIKE $${paramIndex}`
        values.push(searchValue?.toUpperCase())
        paramIndex++
        break
      }

      default:
        throw new QueryValidationError(
          format(
            UNSUPPORTED_OPERATOR_ERROR_MESSAGE,
            operator,
            allowedOperators.join(', ')
          )
        )
    }
  })

  return { whereClause, values }
}
