import Joi from 'joi'

export const createWorkOrderStatusCatalogSchema = Joi.object({
  CODE: Joi.string().max(30).required(),
  NAME: Joi.string().max(100).required(),
  DESCRIPTION: Joi.string().max(250).allow('', null).optional(),
  IS_FINAL: Joi.boolean().optional().default(false),
  ORDER_INDEX: Joi.number().integer().min(0).optional().default(0),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateWorkOrderStatusCatalogSchema = Joi.object({
  STATUS_ID: Joi.number().required(),
  CODE: Joi.string().max(30).optional(),
  NAME: Joi.string().max(100).optional(),
  DESCRIPTION: Joi.string().max(250).allow('', null).optional(),
  IS_FINAL: Joi.boolean().optional(),
  ORDER_INDEX: Joi.number().integer().min(0).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
})

export const workOrderStatusCatalogIdParamsSchema = Joi.object({
  statusId: Joi.number().required(),
})
