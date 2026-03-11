import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createWorkOrderServiceTypeSchema,
  updateWorkOrderServiceTypeSchema,
  workOrderServiceTypeIdParamsSchema,
} from '@api/validators/work-order-service-type.schema'
import {
  createWorkOrderServiceTypeController,
  getOneWorkOrderServiceTypeController,
  getWorkOrderServiceTypeListController,
  getWorkOrderServiceTypePaginationController,
  updateWorkOrderServiceTypeController,
} from '@api/controllers/work-order-service-type.controller'
import {
  PATH_WORK_ORDER_SERVICE_TYPE,
  PATH_WORK_ORDER_SERVICE_TYPE_BY_ID,
  PATH_WORK_ORDER_SERVICE_TYPE_LIST,
  PATH_WORK_ORDER_SERVICE_TYPE_PAGINATION,
} from '@src/constants/routes'

const workOrderServiceTypeRouter = Router()

workOrderServiceTypeRouter.get(
  PATH_WORK_ORDER_SERVICE_TYPE_LIST,
  getWorkOrderServiceTypeListController
)
workOrderServiceTypeRouter.post(
  PATH_WORK_ORDER_SERVICE_TYPE,
  validateSchema(createWorkOrderServiceTypeSchema),
  createWorkOrderServiceTypeController
)
workOrderServiceTypeRouter.put(
  PATH_WORK_ORDER_SERVICE_TYPE,
  validateSchema(updateWorkOrderServiceTypeSchema),
  updateWorkOrderServiceTypeController
)
workOrderServiceTypeRouter.post(
  PATH_WORK_ORDER_SERVICE_TYPE_PAGINATION,
  validateSchema(advancedConditionSchema),
  getWorkOrderServiceTypePaginationController
)
workOrderServiceTypeRouter.get(
  PATH_WORK_ORDER_SERVICE_TYPE_BY_ID,
  validateSchema(workOrderServiceTypeIdParamsSchema, 'params'),
  getOneWorkOrderServiceTypeController
)

export default workOrderServiceTypeRouter
