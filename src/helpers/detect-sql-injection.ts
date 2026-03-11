export function detectSQLInjection(
  condition: string | number | boolean | (string | number)[]
): string | null {
  const suspiciousPatterns = [
    /\bSELECT\b/i, // Palabra clave SELECT
    /\bINSERT\b/i, // Palabra clave INSERT
    /\bUPDATE\b/i, // Palabra clave UPDATE
    /\bDELETE\b/i, // Palabra clave DELETE
    /\bDROP\b/i, // Palabra clave DROP
    /\bOR\b/i, // Palabra clave OR
    /\bAND\b/i, // Palabra clave AND
    /\bWHERE\b/i, // Palabra clave WHERE
    /--/, // Comentarios en SQL
    /;/, // Punto y coma
    /'/, // Comillas simples
    /\b1\s*=\s*1\b/i, // Condición tautológica
    /\bUNION\b/i, // Unión de consultas
  ]

  const checkCondition = (value: string): boolean =>
    suspiciousPatterns.some((pattern) => pattern.test(value))

  for (const pattern of suspiciousPatterns) {
    if (typeof condition === 'string') {
      if (pattern.test(condition)) {
        return `Potential SQL injection detected in condition: "${condition}"`
      }
    } else if (Array.isArray(condition)) {
      for (const item of condition) {
        if (checkCondition(`${item}`)) {
          return `Potential SQL injection detected in condition array item: "${item}"`
        }
      }
    }
  }

  return null
}
