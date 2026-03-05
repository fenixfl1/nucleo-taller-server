import {
  BAD_REQUEST_ERROR,
  DATA_NOT_FOUND_ERROR,
  DB_CONFLICT_ERROR,
  DB_INSERT_ERROR,
  INTERNAL_SERVER_ERROR,
  PAYLOAD_VALIDATION_ERROR,
  QUERY_VALIDATION_ERROR,
  UNAUTHORIZED_ERROR,
  UNEXPECTED_ERROR,
} from '@constants/error-types'
import {
  DB_INSERT_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  NOT_DATA_FOUND_ERROR_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
} from '../constants/messages'
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED,
} from '../constants/status-codes'

interface ErrorInfo {
  status: number
  stack: string
  error: string
}

export class BaseError extends Error {
  declare status: number
  stack?: string
  error: string

  constructor(status: number, message: string, error: string, stack?: string) {
    super(message)

    this.status = status
    this.message = message
    this.stack =
      stack ?? new Error().stack ?? "We couldn't track the error stack"
    this.error = error
  }
}

/**
 * Base function to throw errors, by default the status is `Bad Request (400)` and the error `UnexpectedError`
 * @param {string} message The error message to display
 * @param {ErrorInfo} extra Object that accept `error`, `status`, `stack`
 */
export function throwError(message: string, extra?: Partial<ErrorInfo>): void {
  const {
    status = HTTP_STATUS_BAD_REQUEST,
    error = UNEXPECTED_ERROR,
    stack,
  } = extra || {}

  throw new BaseError(status, message, error, stack)
}

/**
 * Throws an http error code 401 with `UnAuthorizedException` as error name
 * @param message The error message to display
 */
// export function UnAuthorizedException(
//   message: string = UNAUTHORIZED_ERROR_MESSAGE
// ) {
//   throwError(message, {
//     error: UNAUTHORIZED_ERROR,
//     status: HTTP_STATUS_UNAUTHORIZED,
//   })
// }

export class UnAuthorizedException extends BaseError {
  message: string

  constructor(message: string) {
    super(HTTP_STATUS_UNAUTHORIZED, message, UNAUTHORIZED_ERROR)
    this.message = message
  }
}

/**
 * Throws an http error code 500 with `InternalServerException` as error name.
 * This type of error shouldn't be display to the user
 * @param message The error message to display
 * @param status default: 500
 */
export function InternalServerException(
  message: string = INTERNAL_SERVER_ERROR_MESSAGE,
  status: number = HTTP_STATUS_INTERNAL_SERVER_ERROR
) {
  throwError(message, {
    error: INTERNAL_SERVER_ERROR,
    status,
  })
}

/**
 * Throws an http error code 404 with `NoDataFoundException` as error name
 * @param message The error message to display
 * @param status default: 404
 */

export class NotFoundException extends BaseError {
  message: string

  constructor(message: string, status: number = HTTP_STATUS_NOT_FOUND) {
    super(status, message, DATA_NOT_FOUND_ERROR)
    this.message = message
  }
}

/**
 * Throws an http error code 400 with `DbInsertException` as error name
 * @param message The error message to display
 * @param status default: 400
 */
export function DbInsertException(
  message: string = DB_INSERT_ERROR_MESSAGE,
  status: number = HTTP_STATUS_BAD_REQUEST
) {
  throwError(message, { status, error: DB_INSERT_ERROR })
}

/**
 * Throws an http error code 400 with `PayloadValidationException` as error name
 * @param message The error message to display
 * @param status default: 400
 */
export function PayloadValidationError(
  message: string,
  status: number = HTTP_STATUS_BAD_REQUEST
) {
  throwError(message, { status, error: PAYLOAD_VALIDATION_ERROR })
}

// export class PayloadValidationError extends BaseError {
//   message: string
//   status: number

//   constructor(message: string, status: number = HTTP_STATUS_BAD_REQUEST) {
//     super(status, message, PAYLOAD_VALIDATION_ERROR)
//   }
// }

/**
 * throws an http error code 400 with `BadRequestException` as error name.
 * This type of error shouldn't be display to the user
 * @param message The error message to display
 * @param status default: 400
 */
export function BadRequestException(
  message: string,
  status: number = HTTP_STATUS_BAD_REQUEST
) {
  throwError(message, { status, error: BAD_REQUEST_ERROR })
}

/**
 * Throws an http error code 400 with QueryValidationError as error name.
 * This type of error shouldn't be displayed to the user.
 * @param message The error message to display
 * @return void
 */
export function QueryValidationError(message: string): void {
  throwError(message, { error: QUERY_VALIDATION_ERROR })
}

/**
 * Throws an http error code `409` with `DbConflictError` as error name.
 * This error can be display to users.
 * @param message The error message to display
 * @returns void
 */
export class ConflictException extends BaseError {
  message: string

  constructor(message: string) {
    super(HTTP_STATUS_CONFLICT, message, DB_CONFLICT_ERROR)
    this.message = message
  }
}
