import Joi from 'joi'

const internalPurchaseOrderLineSchema = Joi.object({
  ARTICLE_ID: Joi.number().required(),
  QUANTITY: Joi.number().greater(0).precision(2).required(),
  UNIT_COST_REFERENCE: Joi.number().min(0).precision(2).allow(null).optional(),
  NOTES: Joi.string().max(250).allow('', null).optional(),
})

export const createInternalPurchaseOrderSchema = Joi.object({
  ORDER_DATE: Joi.date().allow(null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  ITEMS: Joi.array().items(internalPurchaseOrderLineSchema).min(1).required(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateInternalPurchaseOrderStatusSchema = Joi.object({
  INTERNAL_PURCHASE_ORDER_ID: Joi.number().required(),
  STATUS: Joi.string()
    .valid('GENERADA', 'ENVIADA', 'RECIBIDA', 'CANCELADA')
    .required(),
  ACTION_DATE: Joi.date().allow(null).optional(),
})

export const internalPurchaseOrderIdParamsSchema = Joi.object({
  internalPurchaseOrderId: Joi.number().required(),
})
