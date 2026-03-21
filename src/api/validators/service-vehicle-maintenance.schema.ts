import Joi from 'joi'

const nullableDate = Joi.alternatives()
  .try(Joi.date().iso(), Joi.string().isoDate())
  .allow(null, '')
  .optional()

export const createServiceVehicleMaintenanceSchema = Joi.object({
  SERVICE_VEHICLE_ID: Joi.number().required(),
  MAINTENANCE_TYPE: Joi.string()
    .valid('PREVENTIVO', 'CORRECTIVO', 'INSPECCION', 'CAMBIO_PIEZA', 'OTRO')
    .optional(),
  PRIORITY: Joi.string().valid('BAJA', 'MEDIA', 'ALTA').optional(),
  STATUS: Joi.string()
    .valid('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO')
    .optional(),
  TITLE: Joi.string().max(120).required(),
  DESCRIPTION: Joi.string().max(500).allow('', null).optional(),
  SCHEDULED_AT: nullableDate,
  PERFORMED_AT: nullableDate,
  ODOMETER: Joi.number().integer().min(0).allow(null).optional(),
  COST_REFERENCE: Joi.number().min(0).allow(null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateServiceVehicleMaintenanceSchema = Joi.object({
  SERVICE_VEHICLE_MAINTENANCE_ID: Joi.number().required(),
  SERVICE_VEHICLE_ID: Joi.number().optional(),
  MAINTENANCE_TYPE: Joi.string()
    .valid('PREVENTIVO', 'CORRECTIVO', 'INSPECCION', 'CAMBIO_PIEZA', 'OTRO')
    .optional(),
  PRIORITY: Joi.string().valid('BAJA', 'MEDIA', 'ALTA').optional(),
  STATUS: Joi.string()
    .valid('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO')
    .optional(),
  TITLE: Joi.string().max(120).optional(),
  DESCRIPTION: Joi.string().max(500).allow('', null).optional(),
  SCHEDULED_AT: nullableDate,
  PERFORMED_AT: nullableDate,
  ODOMETER: Joi.number().integer().min(0).allow(null).optional(),
  COST_REFERENCE: Joi.number().min(0).allow(null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
})

export const serviceVehicleMaintenanceIdParamsSchema = Joi.object({
  serviceVehicleMaintenanceId: Joi.number().required(),
})
