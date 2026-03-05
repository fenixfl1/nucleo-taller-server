import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  changeStaffAccessPasswordSchema,
  createStaffAccessSchema,
  updateStaffAccessSchema,
  usernameParamsSchema,
} from '@api/validators/staff-access.schema'
import {
  changeStaffAccessPasswordController,
  createStaffAccessController,
  getOneStaffAccessController,
  getStaffAccessPaginationController,
  updateStaffAccessController,
} from '@api/controllers/staff-access.controller'
import {
  PATH_STAFF_ACCESS,
  PATH_STAFF_ACCESS_BY_USERNAME,
  PATH_STAFF_ACCESS_CHANGE_PASSWORD,
  PATH_STAFF_ACCESS_PAGINATION,
} from '@src/constants/routes'

const staffAccessRouter = Router()

staffAccessRouter.post(
  PATH_STAFF_ACCESS,
  validateSchema(createStaffAccessSchema),
  createStaffAccessController
)
staffAccessRouter.put(
  PATH_STAFF_ACCESS,
  validateSchema(updateStaffAccessSchema),
  updateStaffAccessController
)
staffAccessRouter.post(
  PATH_STAFF_ACCESS_PAGINATION,
  validateSchema(advancedConditionSchema),
  getStaffAccessPaginationController
)
staffAccessRouter.put(
  PATH_STAFF_ACCESS_CHANGE_PASSWORD,
  validateSchema(changeStaffAccessPasswordSchema),
  changeStaffAccessPasswordController
)
staffAccessRouter.get(
  PATH_STAFF_ACCESS_BY_USERNAME,
  validateSchema(usernameParamsSchema, 'params'),
  getOneStaffAccessController
)

export default staffAccessRouter
