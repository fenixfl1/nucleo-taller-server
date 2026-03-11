import Joi from 'joi'

const workOrderServiceLineSchema = Joi.object({
  SERVICE_TYPE: Joi.string().max(30).optional().default('SERVICIO'),
  DESCRIPTION: Joi.string().max(500).required(),
  QUANTITY: Joi.number().greater(0).precision(2).optional().default(1),
  REFERENCE_AMOUNT: Joi.number().min(0).precision(2).optional().default(0),
  NOTES: Joi.string().max(250).allow('', null).optional(),
})

const workOrderConsumedItemSchema = Joi.object({
  ARTICLE_ID: Joi.number().required(),
  QUANTITY: Joi.number().greater(0).precision(2).required(),
  UNIT_COST_REFERENCE: Joi.number().min(0).precision(2).allow(null).optional(),
  NOTES: Joi.string().max(250).allow('', null).optional(),
})

const workOrderTechnicianSchema = Joi.object({
  STAFF_ID: Joi.number().required(),
  ROLE_ON_JOB: Joi.string().max(30).allow('', null).optional(),
  IS_LEAD: Joi.boolean().optional().default(false),
  REFERENCE_PERCENT: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
  REFERENCE_AMOUNT: Joi.number().min(0).precision(2).allow(null).optional(),
  NOTES: Joi.string().max(250).allow('', null).optional(),
})

export const createWorkOrderSchema = Joi.object({
  CUSTOMER_ID: Joi.number().required(),
  VEHICLE_ID: Joi.number().required(),
  STATUS_ID: Joi.number().optional(),
  PROMISED_AT: Joi.date().allow(null).optional(),
  SYMPTOM: Joi.string().max(1000).required(),
  DIAGNOSIS: Joi.string().allow('', null).optional(),
  WORK_PERFORMED: Joi.string().allow('', null).optional(),
  INTERNAL_NOTES: Joi.string().allow('', null).optional(),
  CUSTOMER_OBSERVATIONS: Joi.string().allow('', null).optional(),
  REQUIRES_DISASSEMBLY: Joi.boolean().optional().default(false),
  STATUS_CHANGE_NOTES: Joi.string().max(500).allow('', null).optional(),
  SERVICE_LINES: Joi.array().items(workOrderServiceLineSchema).optional().default([]),
  CONSUMED_ITEMS: Joi.array()
    .items(workOrderConsumedItemSchema)
    .optional()
    .default([]),
  TECHNICIANS: Joi.array().items(workOrderTechnicianSchema).optional().default([]),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateWorkOrderSchema = Joi.object({
  WORK_ORDER_ID: Joi.number().required(),
  CUSTOMER_ID: Joi.number().optional(),
  VEHICLE_ID: Joi.number().optional(),
  STATUS_ID: Joi.number().optional(),
  PROMISED_AT: Joi.date().allow(null).optional(),
  SYMPTOM: Joi.string().max(1000).optional(),
  DIAGNOSIS: Joi.string().allow('', null).optional(),
  WORK_PERFORMED: Joi.string().allow('', null).optional(),
  INTERNAL_NOTES: Joi.string().allow('', null).optional(),
  CUSTOMER_OBSERVATIONS: Joi.string().allow('', null).optional(),
  REQUIRES_DISASSEMBLY: Joi.boolean().optional(),
  STATUS_CHANGE_NOTES: Joi.string().max(500).allow('', null).optional(),
  SERVICE_LINES: Joi.array().items(workOrderServiceLineSchema).optional(),
  CONSUMED_ITEMS: Joi.array().items(workOrderConsumedItemSchema).optional(),
  TECHNICIANS: Joi.array().items(workOrderTechnicianSchema).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
})

export const workOrderIdParamsSchema = Joi.object({
  workOrderId: Joi.number().required(),
})
