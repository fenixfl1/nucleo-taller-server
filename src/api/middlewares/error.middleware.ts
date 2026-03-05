import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@constants/status-codes'
import { INTERNAL_SERVER_ERROR } from '@constants/error-types'
import {
  FIELD_NOT_ALLOWED_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  INVALID_DATA_TYPE_ERROR_MESSAGE,
  REQUIRED_FILED_ERROR_MESSAGE,
} from '@constants/messages'
import { format } from 'util'
import {
  FieldValidationError,
  PayloadValidationError,
} from '@api/errors/validation.error'
import { BaseError } from '@api/errors/base.error'

function mapValidationMessage(e: FieldValidationError): string {
  if (e.message.includes('required')) {
    return format(REQUIRED_FILED_ERROR_MESSAGE, e.field)
  }
  if (e.message.includes('allowed')) {
    return format(FIELD_NOT_ALLOWED_ERROR_MESSAGE, e.field)
  }
  if (e.message.includes('must be')) {
    return format(
      INVALID_DATA_TYPE_ERROR_MESSAGE,
      e.field,
      e.message.split(' ').pop()
    )
  }

  return e.message
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof PayloadValidationError) {
    res.status(err.status).json({
      error: err.name,
      message: err.message,
      errors: err.errors.map((e) => ({
        field: e.field,
        message: mapValidationMessage(e),
      })),
    })
    return
  }

  if (err instanceof BaseError) {
    res.status(err.status).json({
      error: err.error,
      message: err.message,
      details: err.stack,
    })
    return
  }

  res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
    error: INTERNAL_SERVER_ERROR,
    message: err?.['message'] || INTERNAL_SERVER_ERROR_MESSAGE,
    details: err?.['stack'],
  })
}
