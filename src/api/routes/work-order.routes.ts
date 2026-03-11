import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  workOrderIdParamsSchema,
} from '@api/validators/work-order.schema'
import {
  createWorkOrderController,
  getOneWorkOrderController,
  getWorkOrderPaginationController,
  getWorkOrderStatusListController,
  updateWorkOrderController,
} from '@api/controllers/work-order.controller'
import {
  PATH_WORK_ORDER,
  PATH_WORK_ORDER_BY_ID,
  PATH_WORK_ORDER_PAGINATION,
  PATH_WORK_ORDER_STATUS_LIST,
} from '@src/constants/routes'

const workOrderRouter = Router()

workOrderRouter.get(PATH_WORK_ORDER_STATUS_LIST, getWorkOrderStatusListController)
workOrderRouter.post(
  PATH_WORK_ORDER,
  validateSchema(createWorkOrderSchema),
  createWorkOrderController
)
workOrderRouter.put(
  PATH_WORK_ORDER,
  validateSchema(updateWorkOrderSchema),
  updateWorkOrderController
)
workOrderRouter.post(
  PATH_WORK_ORDER_PAGINATION,
  validateSchema(advancedConditionSchema),
  getWorkOrderPaginationController
)
workOrderRouter.get(
  PATH_WORK_ORDER_BY_ID,
  validateSchema(workOrderIdParamsSchema, 'params'),
  getOneWorkOrderController
)

export default workOrderRouter
