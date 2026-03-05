import Joi from 'joi'

const contactSchema = Joi.object({
  TYPE: Joi.string().valid('email', 'phone', 'whatsapp', 'other').required(),
  USAGE: Joi.string().valid('personal', 'emergency').optional().default('personal'),
  VALUE: Joi.string().max(255).required(),
  IS_PRIMARY: Joi.boolean().optional().default(false),
})

export const createStaffAccessSchema = Joi.object({
  NAME: Joi.string().max(120).required(),
  LAST_NAME: Joi.string().max(120).allow('', null).required(),
  IDENTITY_DOCUMENT: Joi.string().pattern(/^[0-9]{11}$/).required(),
  BIRTH_DATE: Joi.date().allow(null).optional(),
  GENDER: Joi.string().valid('M', 'F', 'O').required(),
  ADDRESS: Joi.string().max(250).allow('', null).optional(),
  CONTACTS: Joi.array().items(contactSchema).optional().default([]),
  USERNAME: Joi.string().min(3).max(60).required(),
  ROLE_ID: Joi.number().required(),
  AVATAR: Joi.string().allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
  PASSWORD: Joi.string().min(8).max(120).optional(),
})

export const updateStaffAccessSchema = Joi.object({
  USER_ID: Joi.number().required(),
  USERNAME: Joi.string().min(3).max(60).optional(),
  ROLE_ID: Joi.number().optional(),
  NAME: Joi.string().max(120).optional(),
  LAST_NAME: Joi.string().max(120).allow('', null).optional(),
  IDENTITY_DOCUMENT: Joi.string().pattern(/^[0-9]{11}$/).allow('', null).optional(),
  BIRTH_DATE: Joi.date().allow(null).optional(),
  GENDER: Joi.string().valid('M', 'F', 'O').allow('', null).optional(),
  ADDRESS: Joi.string().max(250).allow('', null).optional(),
  CONTACTS: Joi.array().items(contactSchema).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
  AVATAR: Joi.string().allow('', null).optional(),
})

export const usernameParamsSchema = Joi.object({
  username: Joi.string().required(),
})

export const changeStaffAccessPasswordSchema = Joi.object({
  OLD_PASSWORD: Joi.string().required(),
  NEW_PASSWORD: Joi.string().min(8).required(),
  USER_ID: Joi.number().required(),
})
