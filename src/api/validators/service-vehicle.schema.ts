import Joi from 'joi'

export const createServiceVehicleSchema = Joi.object({
  NAME: Joi.string().max(100).required(),
  PLATE: Joi.string().max(20).allow('', null).optional(),
  VIN: Joi.string().max(30).allow('', null).optional(),
  BRAND: Joi.string().max(60).required(),
  MODEL: Joi.string().max(60).required(),
  YEAR: Joi.number().integer().min(1900).max(2100).allow(null).optional(),
  COLOR: Joi.string().max(30).allow('', null).optional(),
  ENGINE: Joi.string().max(60).allow('', null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateServiceVehicleSchema = Joi.object({
  SERVICE_VEHICLE_ID: Joi.number().required(),
  NAME: Joi.string().max(100).optional(),
  PLATE: Joi.string().max(20).allow('', null).optional(),
  VIN: Joi.string().max(30).allow('', null).optional(),
  BRAND: Joi.string().max(60).optional(),
  MODEL: Joi.string().max(60).optional(),
  YEAR: Joi.number().integer().min(1900).max(2100).allow(null).optional(),
  COLOR: Joi.string().max(30).allow('', null).optional(),
  ENGINE: Joi.string().max(60).allow('', null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
})

export const serviceVehicleIdParamsSchema = Joi.object({
  serviceVehicleId: Joi.number().required(),
})
