import Joi from 'joi'

export const activityLogIdParamsSchema = Joi.object({
  activityLogId: Joi.number().required(),
})
