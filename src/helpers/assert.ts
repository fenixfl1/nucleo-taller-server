/**
 * This function asserts a value given some type guard
 * @param {unknown} value the value to assert
 */
export function assert<T>(value: unknown): asserts value is T {
  try {
    if (typeof value === 'undefined' || value === null) {
      throw new Error('Value is not defined')
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}
