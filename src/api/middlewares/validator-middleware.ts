import Joi, { ValidationError } from 'joi'
import { NextFunction, Request, Response } from 'express'
import { ParamsLocation } from '@src/types/api.types'
import {
  handleJoiError,
  PayloadValidationError,
} from '@api/errors/validation.error'

export const validateSchema = (
  schema: Joi.ObjectSchema | Joi.ArraySchema,
  location: ParamsLocation = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[location], {
      abortEarly: false,
      convert: true,
    })

    if (!error) {
      req[location] = value
      return next()
    }

    const fieldErrors = handleJoiError(error)
    throw new PayloadValidationError(fieldErrors)
  }
}
