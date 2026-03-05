import Joi from 'joi'

const contactSchema = Joi.object({
  TYPE: Joi.string().valid('email', 'phone', 'whatsapp', 'other').required(),
  USAGE: Joi.string().valid('personal', 'emergency').optional().default('personal'),
  VALUE: Joi.string().max(255).required(),
  IS_PRIMARY: Joi.boolean().optional().default(false),
})

export const createPersonSchema = Joi.object({
  NAME: Joi.string().max(120).required(),
  LAST_NAME: Joi.string().max(120).allow('', null).optional(),
  IDENTITY_DOCUMENT: Joi.string().max(11).allow('', null).optional(),
  BIRTH_DATE: Joi.date().allow(null).optional(),
  GENDER: Joi.string().valid('M', 'F', 'O').allow('', null).optional(),
  ADDRESS: Joi.string().max(250).allow('', null).optional(),
  CONTACTS: Joi.array().items(contactSchema).optional().default([]),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
  EMAIL: Joi.string().email().allow('', null).optional(),
  PHONE: Joi.string().max(25).allow('', null).optional(),
})

export const updatePersonSchema = Joi.object({
  PERSON_ID: Joi.number().optional(),
  STAFF_ID: Joi.number().optional(),
  NAME: Joi.string().max(120).optional(),
  LAST_NAME: Joi.string().max(120).allow('', null).optional(),
  IDENTITY_DOCUMENT: Joi.string().max(11).allow('', null).optional(),
  BIRTH_DATE: Joi.date().allow(null).optional(),
  GENDER: Joi.string().valid('M', 'F', 'O').allow('', null).optional(),
  ADDRESS: Joi.string().max(250).allow('', null).optional(),
  CONTACTS: Joi.array().items(contactSchema).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
  EMAIL: Joi.string().email().allow('', null).optional(),
  PHONE: Joi.string().max(25).allow('', null).optional(),
}).or('PERSON_ID', 'STAFF_ID')

export const personIdParamsSchema = Joi.object({
  personId: Joi.number().required(),
})

export const validateIdentityDocumentSchema = Joi.object({
  identityDocument: Joi.string().max(11).required(),
})
