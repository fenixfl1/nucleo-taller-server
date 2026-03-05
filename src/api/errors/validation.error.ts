import Joi from 'joi'
import { PAYLOAD_VALIDATION_ERROR } from '@constants/error-types'
import { HTTP_STATUS_BAD_REQUEST } from '@constants/status-codes'

import { BaseError } from './base.error'

export class FieldValidationError extends BaseError {
  constructor(
    message: string,
    // eslint-disable-next-line no-unused-vars
    public field: string,
    code?: string
  ) {
    super(HTTP_STATUS_BAD_REQUEST, message, PAYLOAD_VALIDATION_ERROR, code)
  }
}

export class PayloadValidationError extends BaseError {
  constructor(public errors: FieldValidationError[]) {
    super(
      HTTP_STATUS_BAD_REQUEST,
      'Uno o más campos no son válidos.',
      PAYLOAD_VALIDATION_ERROR
    )
    errors
  }
}

export function handleJoiError(
  joiError: Joi.ValidationError
): FieldValidationError[] {
  return joiError.details.map(
    (err: any) =>
      new FieldValidationError(err.message, err.path.join('.'), err.type)
  )
}
