import { AdvancedCondition } from '@src/types/api.types'

export function preparePaginationConditions<T = Record<string, unknown>>(
  conditions: AdvancedCondition<T>[] = [],
  filterFields: string[] = []
): AdvancedCondition<Record<string, unknown>>[] {
  const normalizedFilterFields = filterFields.map((field) => field.toUpperCase())

  return conditions.flatMap((condition) => {
    const operator = (condition.operator || '').toUpperCase()
    const field = Array.isArray(condition.field)
      ? condition.field.map((item) => String(item).toUpperCase())
      : String(condition.field).toUpperCase()

    if (field === 'FILTER') {
      const normalizedFilter = `${condition.value || ''}`.trim()

      if (!normalizedFilter || !normalizedFilterFields.length) {
        return []
      }

      return [
        {
          field: normalizedFilterFields,
          operator: 'LIKE',
          value: normalizedFilter,
        },
      ]
    }

    if (operator === 'LIKE' && `${condition.value || ''}`.trim() === '') {
      return []
    }

    if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
      return [
        {
          ...condition,
          field,
          operator: 'IS NULL',
          value: operator === 'IS NULL',
        },
      ]
    }

    if (typeof condition.value === 'boolean') {
      return [
        {
          ...condition,
          field,
          value: condition.value ? 'TRUE' : 'FALSE',
        },
      ]
    }

    return [
      {
        ...condition,
        field,
      },
    ]
  })
}
