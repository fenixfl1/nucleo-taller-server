import { AdvancedCondition } from '@src/types/api.types'
import { SelectQueryBuilder } from 'typeorm'

export function queryBuilder<T>(
  qb: SelectQueryBuilder<T>,
  conditions: AdvancedCondition<T>[],
  alias: string = qb.alias
): {
  qb: SelectQueryBuilder<T>
  parameters: Record<string, any>
} {
  const parameters: Record<string, any> = {}

  conditions.forEach((condition, index) => {
    const { field, operator, value } = condition
    const paramName = `param_${index}`

    const column = Array.isArray(field)
      ? field.map((f) => `"${alias}"."${String(f)}"`).join(" || ' ' || ")
      : `"${alias}"."${String(field)}"`

    switch (operator.toUpperCase()) {
      case '=':
      case '!=':
      case '<':
      case '<=':
      case '>':
      case '>=':
        parameters[paramName] = value
        qb.andWhere(`${column} ${operator} :${paramName}`, {
          [paramName]: value,
        })
        break

      case 'LIKE':
        parameters[paramName] = `%${value}%`
        qb.andWhere(`UPPER(unaccent(${column})) LIKE UPPER(:${paramName})`, {
          [paramName]: `%${value}%`,
        })
        break

      case 'IN':
      case 'NOT IN':
        if (Array.isArray(value)) {
          parameters[paramName] = value
          qb.andWhere(`${column} ${operator} (:...${paramName})`, {
            [paramName]: value,
          })
        }
        break

      case 'BETWEEN':
        if (Array.isArray(value) && value.length === 2) {
          parameters[`${paramName}_start`] = value[0]
          parameters[`${paramName}_end`] = value[1]
          qb.andWhere(
            `${column} BETWEEN :${paramName}_start AND :${paramName}_end`,
            {
              [`${paramName}_start`]: value[0],
              [`${paramName}_end`]: value[1],
            }
          )
        }
        break

      case 'IS NULL':
        qb.andWhere(`${column} IS NULL`)
        break

      case 'IS NOT NULL':
        qb.andWhere(`${column} IS NOT NULL`)
        break

      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }
  })

  return { qb, parameters }
}
