import { assert } from './assert'

/**
 * This function is used to validate is an given value is a valid date.
 * @param {unknown} value the value to validate
 * @return {boolean} return true or false if is a valid date or not
 */
export function isValidDate(value: unknown): boolean {
  // Valida un único string en formato permitido
  const validateOne = (s: string): boolean => {
    // YYYY-MM-DD
    const regexSimple = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    // YYYY-MM-DDTHH:mm:ss.SSSZ
    const regexISO =
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/

    if (regexSimple.test(s)) {
      // Construimos en UTC y comparamos componentes para evitar problemas de zona horaria
      const [yStr, mStr, dStr] = s.split('-')
      const y = Number(yStr)
      const m = Number(mStr)
      const d = Number(dStr)

      const dt = new Date(Date.UTC(y, m - 1, d))
      return (
        !isNaN(dt.getTime()) &&
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
      )
    }

    if (regexISO.test(s)) {
      const dt = new Date(s)
      return !isNaN(dt.getTime()) && s === dt.toISOString()
    }

    return false
  }

  // Caso: string simple
  if (typeof value === 'string') {
    return validateOne(value)
  }

  // Caso: array [string, string]
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'string'
  ) {
    return validateOne(value[0]) && validateOne(value[1])
  }

  // Para cualquier otro tipo/forma -> false
  return false
}
