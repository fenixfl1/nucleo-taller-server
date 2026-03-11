import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  getActivityLogPaginationController,
  getOneActivityLogController,
} from '@api/controllers/activity-log.controller'
import { activityLogIdParamsSchema } from '@api/validators/activity-log.schema'
import {
  PATH_ACTIVITY_LOG_BY_ID,
  PATH_ACTIVITY_LOG_PAGINATION,
} from '@src/constants/routes'

const activityLogRouter = Router()

activityLogRouter.post(
  PATH_ACTIVITY_LOG_PAGINATION,
  validateSchema(advancedConditionSchema),
  getActivityLogPaginationController
)

activityLogRouter.get(
  PATH_ACTIVITY_LOG_BY_ID,
  validateSchema(activityLogIdParamsSchema, 'params'),
  getOneActivityLogController
)

export default activityLogRouter
