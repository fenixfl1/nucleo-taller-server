import { SimpleCondition } from '@src/types/api.types'
import Joi, { ObjectSchema } from 'joi'

export const advancedConditionSchema = Joi.array().items(
  Joi.object({
    operator: Joi.string().required(),
    field: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    value: Joi.alternatives()
      .try(
        Joi.string().allow(''),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string(), Joi.number())
      )
      .required(),
  })
)

export const simpleConditionSchema: ObjectSchema<SimpleCondition<any>> =
  Joi.object({
    condition: Joi.object().unknown(true).required(),

    select: Joi.array().items(Joi.string()).optional(),

    orden: Joi.object()
      .pattern(Joi.string(), Joi.string().valid('ASC', 'DESC'))
      .optional(),
  })
