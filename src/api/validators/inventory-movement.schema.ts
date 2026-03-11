import Joi from 'joi'

const movementTypes = [
  'ENTRY',
  'EXIT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
]

const inventoryMovementDetailSchema = Joi.object({
  ARTICLE_ID: Joi.number().required(),
  QUANTITY: Joi.number().greater(0).precision(2).required(),
  UNIT_COST_REFERENCE: Joi.number().min(0).precision(2).allow(null).optional(),
  NOTES: Joi.string().max(250).allow('', null).optional(),
})

export const createInventoryMovementSchema = Joi.object({
  MOVEMENT_TYPE: Joi.string()
    .valid(...movementTypes)
    .required(),
  MOVEMENT_DATE: Joi.date().allow(null).optional(),
  NOTES: Joi.string().max(500).allow('', null).optional(),
  DETAILS: Joi.array().items(inventoryMovementDetailSchema).min(1).required(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const inventoryMovementIdParamsSchema = Joi.object({
  movementId: Joi.number().required(),
})
