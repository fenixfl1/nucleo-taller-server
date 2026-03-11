import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createWorkOrderStatusCatalogSchema,
  updateWorkOrderStatusCatalogSchema,
  workOrderStatusCatalogIdParamsSchema,
} from '@api/validators/work-order-status-catalog.schema'
import {
  createWorkOrderStatusCatalogController,
  getOneWorkOrderStatusCatalogController,
  getWorkOrderStatusCatalogPaginationController,
  updateWorkOrderStatusCatalogController,
} from '@api/controllers/work-order-status-catalog.controller'
import {
  PATH_WORK_ORDER_STATUS,
  PATH_WORK_ORDER_STATUS_BY_ID,
  PATH_WORK_ORDER_STATUS_PAGINATION,
} from '@src/constants/routes'

const workOrderStatusCatalogRouter = Router()

workOrderStatusCatalogRouter.post(
  PATH_WORK_ORDER_STATUS,
  validateSchema(createWorkOrderStatusCatalogSchema),
  createWorkOrderStatusCatalogController
)
workOrderStatusCatalogRouter.put(
  PATH_WORK_ORDER_STATUS,
  validateSchema(updateWorkOrderStatusCatalogSchema),
  updateWorkOrderStatusCatalogController
)
workOrderStatusCatalogRouter.post(
  PATH_WORK_ORDER_STATUS_PAGINATION,
  validateSchema(advancedConditionSchema),
  getWorkOrderStatusCatalogPaginationController
)
workOrderStatusCatalogRouter.get(
  PATH_WORK_ORDER_STATUS_BY_ID,
  validateSchema(workOrderStatusCatalogIdParamsSchema, 'params'),
  getOneWorkOrderStatusCatalogController
)

export default workOrderStatusCatalogRouter
