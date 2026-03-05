import Joi from 'joi'

export const createVehicleSchema = Joi.object({
  CUSTOMER_ID: Joi.number().required(),
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

export const updateVehicleSchema = Joi.object({
  VEHICLE_ID: Joi.number().required(),
  CUSTOMER_ID: Joi.number().optional(),
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

export const vehicleIdParamsSchema = Joi.object({
  vehicleId: Joi.number().required(),
})
