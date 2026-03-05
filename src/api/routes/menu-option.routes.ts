import { Router } from 'express'
import { validateSchema } from '../middlewares/validator-middleware'
import {
  createMenuOptionController,
  getMenuOptionController,
  getMenuOptionsWithPermissionsController,
  updateMenuOptionController,
} from '../controllers/menu-option.controller'
import {
  createMenuOptionsSchema,
  updateMenuOptionsSchema,
} from '@api/validators/menu-option.schema'
import {
  PATH_CREATE_MENU_OPTION,
  PATH_GET_MENU_OPTIONS_WITH_PERMISSIONS,
  PATH_GET_USER_MENU_OPTIONS,
  PATH_UPDATE_MENU_OPTION,
} from '@src/constants/routes'
import { advancedConditionSchema } from '@api/validators/condition.schema'

const menuOptionRouter = Router()

menuOptionRouter.get(PATH_GET_USER_MENU_OPTIONS, getMenuOptionController)
menuOptionRouter.post(
  PATH_GET_MENU_OPTIONS_WITH_PERMISSIONS,
  validateSchema(advancedConditionSchema),
  getMenuOptionsWithPermissionsController
)

menuOptionRouter.post(
  PATH_CREATE_MENU_OPTION,
  validateSchema(createMenuOptionsSchema),
  createMenuOptionController
)
menuOptionRouter.put(
  PATH_UPDATE_MENU_OPTION,
  validateSchema(updateMenuOptionsSchema),
  updateMenuOptionController
)

export default menuOptionRouter
