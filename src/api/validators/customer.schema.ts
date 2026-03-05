import Joi from 'joi'
import { createPersonSchema, updatePersonSchema } from './person.schema'

export const createCustomerSchema = createPersonSchema
export const updateCustomerSchema = updatePersonSchema

export const customerIdParamsSchema = Joi.object({
  customerId: Joi.number().required(),
})

export const validateCustomerIdentityDocumentSchema = Joi.object({
  identityDocument: Joi.string().max(11).required(),
})
