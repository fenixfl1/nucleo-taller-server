import Joi from 'joi'

const nullableDate = Joi.alternatives()
  .try(Joi.date().iso(), Joi.string().isoDate())
  .allow(null, '')
  .optional()

export const createServiceVehicleUsageSchema = Joi.object({
  SERVICE_VEHICLE_ID: Joi.number().required(),
  STAFF_ID: Joi.number().allow(null).optional(),
  STATUS: Joi.string().valid('EN_CURSO', 'FINALIZADA', 'CANCELADA').optional(),
  PURPOSE: Joi.string().max(150).required(),
  ORIGIN: Joi.string().max(120).allow('', null).optional(),
  DESTINATION: Joi.string().max(120).allow('', null).optional(),
  STARTED_AT: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().isoDate())
    .required(),
  ENDED_AT: nullableDate,
  ODOMETER_START: Joi.number().integer().min(0).allow(null).optional(),
  ODOMETER_END: Joi.number().integer().min(0).allow(null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateServiceVehicleUsageSchema = Joi.object({
  SERVICE_VEHICLE_USAGE_ID: Joi.number().required(),
  SERVICE_VEHICLE_ID: Joi.number().optional(),
  STAFF_ID: Joi.number().allow(null).optional(),
  STATUS: Joi.string().valid('EN_CURSO', 'FINALIZADA', 'CANCELADA').optional(),
  PURPOSE: Joi.string().max(150).optional(),
  ORIGIN: Joi.string().max(120).allow('', null).optional(),
  DESTINATION: Joi.string().max(120).allow('', null).optional(),
  STARTED_AT: nullableDate,
  ENDED_AT: nullableDate,
  ODOMETER_START: Joi.number().integer().min(0).allow(null).optional(),
  ODOMETER_END: Joi.number().integer().min(0).allow(null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
})

export const serviceVehicleUsageIdParamsSchema = Joi.object({
  serviceVehicleUsageId: Joi.number().required(),
})
