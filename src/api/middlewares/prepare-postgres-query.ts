export function preparePostgresQuery(
  query: string,
  params: Record<string, unknown>
): { query: string; values: unknown[] } {
  const paramIndexMap = new Map<string, number>()
  const values: unknown[] = []
  let counter = 0

  const transformedQuery = query.replace(
    /:([a-zA-Z0-9_]+)/g,
    (match: string, name: string, offset: number, full: string) => {
      // Skip casts like ::int
      if (offset > 0 && full[offset - 1] === ':') {
        return match
      }

      let position = paramIndexMap.get(name)
      if (position === undefined) {
        counter += 1
        position = counter
        paramIndexMap.set(name, position)
        values.push(params[name])
      }

      return `$${position}`
    }
  )

  return { query: transformedQuery, values }
}
