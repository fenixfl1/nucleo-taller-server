import Joi from 'joi'

const itemTypeValues = ['RADIADOR', 'REPUESTO', 'MATERIAL', 'INSUMO', 'OTRO']
const articleCompatibilitySchema = Joi.object({
  BRAND: Joi.string().max(60).required(),
  MODEL: Joi.string().max(80).required(),
  YEAR_FROM: Joi.number().integer().min(1900).max(2100).allow(null).optional(),
  YEAR_TO: Joi.number().integer().min(1900).max(2100).allow(null).optional(),
  ENGINE: Joi.string().max(60).allow('', null).optional(),
  NOTES: Joi.string().max(250).allow('', null).optional(),
})

export const createArticleSchema = Joi.object({
  CODE: Joi.string().max(30).required(),
  NAME: Joi.string().max(120).required(),
  ITEM_TYPE: Joi.string()
    .valid(...itemTypeValues)
    .optional()
    .default('REPUESTO'),
  UNIT_MEASURE: Joi.string().max(20).optional().default('UND'),
  CATEGORY: Joi.string().max(60).allow('', null).optional(),
  MIN_STOCK: Joi.number().min(0).precision(2).optional().default(0),
  MAX_STOCK: Joi.number().min(0).precision(2).allow(null).optional(),
  CURRENT_STOCK: Joi.number().min(0).precision(2).optional().default(0),
  COST_REFERENCE: Joi.number().min(0).precision(2).allow(null).optional(),
  DESCRIPTION: Joi.string().max(500).allow('', null).optional(),
  COMPATIBILITIES: Joi.array().items(articleCompatibilitySchema).optional(),
  STATE: Joi.string().valid('A', 'I').optional().default('A'),
})

export const updateArticleSchema = Joi.object({
  ARTICLE_ID: Joi.number().required(),
  CODE: Joi.string().max(30).optional(),
  NAME: Joi.string().max(120).optional(),
  ITEM_TYPE: Joi.string()
    .valid(...itemTypeValues)
    .optional(),
  UNIT_MEASURE: Joi.string().max(20).optional(),
  CATEGORY: Joi.string().max(60).allow('', null).optional(),
  MIN_STOCK: Joi.number().min(0).precision(2).optional(),
  MAX_STOCK: Joi.number().min(0).precision(2).allow(null).optional(),
  CURRENT_STOCK: Joi.number().min(0).precision(2).optional(),
  COST_REFERENCE: Joi.number().min(0).precision(2).allow(null).optional(),
  DESCRIPTION: Joi.string().max(500).allow('', null).optional(),
  COMPATIBILITIES: Joi.array().items(articleCompatibilitySchema).optional(),
  STATE: Joi.string().valid('A', 'I').optional(),
})

export const articleIdParamsSchema = Joi.object({
  articleId: Joi.number().required(),
})

export const compatibleArticleByVehicleParamsSchema = Joi.object({
  vehicleId: Joi.number().required(),
})
