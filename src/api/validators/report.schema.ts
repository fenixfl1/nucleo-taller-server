import Joi from 'joi'

export const operationalReportSchema = Joi.object({
  START_DATE: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null, ''),
  END_DATE: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null, ''),
})
