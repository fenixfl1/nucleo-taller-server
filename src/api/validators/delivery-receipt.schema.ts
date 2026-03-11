import Joi from 'joi'

export const createDeliveryReceiptSchema = Joi.object({
  WORK_ORDER_ID: Joi.number().required(),
  DELIVERY_DATE: Joi.date().allow(null).optional(),
  RECEIVED_BY_NAME: Joi.string().max(120).required(),
  RECEIVED_BY_DOCUMENT: Joi.string().max(30).allow('', null).optional(),
  RECEIVED_BY_PHONE: Joi.string().max(30).allow('', null).optional(),
  OBSERVATIONS: Joi.string().max(500).allow('', null).optional(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const deliveryReceiptIdParamsSchema = Joi.object({
  receiptId: Joi.number().required(),
})
