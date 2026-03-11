/**
 * Sanitizes input values to prevent SQL injection
 * @param {string | number | Date} value - The value to sanitize
 * @returns {T} - The sanitized value
 */
export function sanitizeValue<T>(value: T): T {
  if (typeof value === 'string') {
    // Check if the string is in DD/MM/YYYY format
    const datePatternDDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/
    if (datePatternDDMMYYYY.test(value)) {
      const match = value.match(datePatternDDMMYYYY)
      if (match) {
        const [, day, month, year] = match
        // Convert to ISO 8601 format (YYYY-MM-DD)
        return `${year}-${month}-${day}` as unknown as T
      }
    }

    // Check if the string is in ISO 8601 format with time
    const datePatternISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    if (datePatternISO.test(value)) {
      // Convert to ISO 8601 date format (YYYY-MM-DD)
      return value.split('T')[0] as unknown as T
    }

    // Escape single quotes by replacing them with two single quotes
    return value.replace(/'/g, "''") as unknown as T
  } else if (value instanceof Date) {
    // Convert Date to ISO 8601 format
    return value.toISOString().split('T')[0] as unknown as T
  }

  // Return the value as is if no sanitization is needed
  return value
}
