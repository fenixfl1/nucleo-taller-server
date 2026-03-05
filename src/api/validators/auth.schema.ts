import Joi, { string } from 'joi'

export const authSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
})

export const requestPasswordResetSchema = Joi.object().keys({
  EMAIL: Joi.string().required(),
  USERNAME: Joi.string().required(),
})

export const resetPasswordSchema = Joi.object().keys({
  password: Joi.string().required(),
  token: Joi.string().required(),
})
