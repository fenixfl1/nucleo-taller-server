import Joi from 'joi'

export const createRoleSchema = Joi.object({
  NAME: Joi.string().max(30).required(),
  DESCRIPTION: Joi.string().max(250).allow('', null).default(''),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
  PERMISSIONS: Joi.array().items(Joi.number().required()).required(),
})

export const updateRoleSchema = Joi.object({
  ROLE_ID: Joi.number().required(),
  NAME: Joi.string().max(30).optional(),
  DESCRIPTION: Joi.string().max(250).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
  PERMISSIONS: Joi.array().items(Joi.number().required()).optional(),
})
