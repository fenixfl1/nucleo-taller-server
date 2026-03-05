import { UNEXPECTED_ERROR } from '@constants/error-types'
import { HTTP_STATUS_BAD_REQUEST } from '@constants/status-codes'

interface ErrorMetadata {
  status?: number
  stack?: string
  error?: string
}

/**
 * Base error class with HTTP status and error identifier
 */
export class BaseError extends Error {
  status: number
  error: string

  constructor(status: number, message: string, error: string, stack?: string) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    this.error = error

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Generic error thrower with optional metadata
 */
export function throwError(message: string, meta: ErrorMetadata = {}): never {
  const {
    status = HTTP_STATUS_BAD_REQUEST,
    error = UNEXPECTED_ERROR,
    stack,
  } = meta
  throw new BaseError(status, message, error, stack)
}
