import Joi from 'joi'

export const createWorkOrderServiceTypeSchema = Joi.object({
  CODE: Joi.string().max(30).required(),
  NAME: Joi.string().max(100).required(),
  DESCRIPTION: Joi.string().max(250).allow('', null).optional(),
  BASE_PRICE: Joi.number().min(0).optional().default(0),
  ORDER_INDEX: Joi.number().integer().min(0).optional().default(0),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateWorkOrderServiceTypeSchema = Joi.object({
  SERVICE_TYPE_ID: Joi.number().required(),
  CODE: Joi.string().max(30).optional(),
  NAME: Joi.string().max(100).optional(),
  DESCRIPTION: Joi.string().max(250).allow('', null).optional(),
  BASE_PRICE: Joi.number().min(0).optional(),
  ORDER_INDEX: Joi.number().integer().min(0).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
})

export const workOrderServiceTypeIdParamsSchema = Joi.object({
  serviceTypeId: Joi.number().required(),
})
