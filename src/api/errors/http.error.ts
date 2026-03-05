import {
  UNAUTHORIZED_ERROR,
  INTERNAL_SERVER_ERROR,
  DATA_NOT_FOUND_ERROR,
  DB_INSERT_ERROR,
  BAD_REQUEST_ERROR,
  QUERY_VALIDATION_ERROR,
  DB_CONFLICT_ERROR,
  FORBIDDEN_ERROR,
  FORBIDDEN_SQL_STATEMENT_ERROR,
  TEST_SQL_ERROR,
} from '@constants/error-types'
import {
  DB_INSERT_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  NOT_DATA_FOUND_ERROR_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
} from '@constants/messages'
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED,
} from '@constants/status-codes'

import { BaseError } from './base.error'

export class UnAuthorizedError extends BaseError {
  constructor(message: string = UNAUTHORIZED_ERROR_MESSAGE) {
    super(HTTP_STATUS_UNAUTHORIZED, message, UNAUTHORIZED_ERROR)
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = INTERNAL_SERVER_ERROR_MESSAGE) {
    super(HTTP_STATUS_INTERNAL_SERVER_ERROR, message, INTERNAL_SERVER_ERROR)
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = NOT_DATA_FOUND_ERROR_MESSAGE) {
    super(HTTP_STATUS_NOT_FOUND, message, DATA_NOT_FOUND_ERROR)
  }
}

export class DbInsertError extends BaseError {
  constructor(message: string = DB_INSERT_ERROR_MESSAGE) {
    super(HTTP_STATUS_BAD_REQUEST, message, DB_INSERT_ERROR)
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(HTTP_STATUS_BAD_REQUEST, message, BAD_REQUEST_ERROR)
  }
}

export class QueryValidationError extends BaseError {
  constructor(message: string) {
    super(HTTP_STATUS_BAD_REQUEST, message, QUERY_VALIDATION_ERROR)
  }
}

export class DbConflictError extends BaseError {
  constructor(message: string) {
    super(HTTP_STATUS_CONFLICT, message, DB_CONFLICT_ERROR)
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = UNAUTHORIZED_ERROR_MESSAGE) {
    super(HTTP_STATUS_FORBIDDEN, message, FORBIDDEN_ERROR)
  }
}

export class ForbiddenSqlStatementError extends BaseError {
  constructor(statement: string) {
    super(
      HTTP_STATUS_BAD_REQUEST,
      `The SQL statement contains a forbidden operation: ${statement}`,
      FORBIDDEN_SQL_STATEMENT_ERROR
    )
  }
}

export class SqlTestError extends BaseError {
  constructor(error: Error) {
    super(HTTP_STATUS_BAD_REQUEST, error.message, TEST_SQL_ERROR)
  }
}
