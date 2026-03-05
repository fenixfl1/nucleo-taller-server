import Joi from 'joi'

export const createMenuOptionsSchema = Joi.object({
  PARENT_ID: Joi.string().optional(),
  NAME: Joi.string().required(),
  DESCRIPTION: Joi.string().required(),
  TYPE: Joi.string()
    .valid('link', 'divider', 'group', 'item', 'submenu')
    .allow(null)
    .default('item')
    .optional(),
  ICON: Joi.string().allow('', null).optional(),
  ORDER: Joi.number().required(),
  MENU_OPTION_ID: Joi.string().optional(),
  ESTATE: Joi.string().valid('A', 'I').optional().default('A'),
  PATH: Joi.string().optional().allow(null, ''),
})

export const updateMenuOptionsSchema = Joi.object({
  PARENT_ID: Joi.string().optional(),
  NAME: Joi.string().optional(),
  DESCRIPTION: Joi.string().optional(),
  TYPE: Joi.string()
    .valid('link', 'divider', 'group', 'item', 'submenu')
    .allow(null)
    .default('item')
    .optional(),
  ICON: Joi.string().optional(),
  ORDER: Joi.number().optional(),
  MENU_OPTION_ID: Joi.string().required(),
  ESTATE: Joi.string().valid('A', 'I').optional().default('A'),
  PATH: Joi.string().optional().allow(null, ''),
})
