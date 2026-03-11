import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import {
  createInternalPurchaseOrderController,
  getInternalPurchaseOrderPaginationController,
  getOneInternalPurchaseOrderController,
  updateInternalPurchaseOrderStatusController,
} from '@api/controllers/internal-purchase-order.controller'
import {
  createInternalPurchaseOrderSchema,
  internalPurchaseOrderIdParamsSchema,
  updateInternalPurchaseOrderStatusSchema,
} from '@api/validators/internal-purchase-order.schema'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  PATH_INTERNAL_PURCHASE_ORDER,
  PATH_INTERNAL_PURCHASE_ORDER_BY_ID,
  PATH_INTERNAL_PURCHASE_ORDER_PAGINATION,
  PATH_INTERNAL_PURCHASE_ORDER_STATUS,
} from '@src/constants/routes'

const internalPurchaseOrderRouter = Router()

internalPurchaseOrderRouter.post(
  PATH_INTERNAL_PURCHASE_ORDER,
  validateSchema(createInternalPurchaseOrderSchema),
  createInternalPurchaseOrderController
)

internalPurchaseOrderRouter.post(
  PATH_INTERNAL_PURCHASE_ORDER_PAGINATION,
  validateSchema(advancedConditionSchema),
  getInternalPurchaseOrderPaginationController
)

internalPurchaseOrderRouter.put(
  PATH_INTERNAL_PURCHASE_ORDER_STATUS,
  validateSchema(updateInternalPurchaseOrderStatusSchema),
  updateInternalPurchaseOrderStatusController
)

internalPurchaseOrderRouter.get(
  PATH_INTERNAL_PURCHASE_ORDER_BY_ID,
  validateSchema(internalPurchaseOrderIdParamsSchema, 'params'),
  getOneInternalPurchaseOrderController
)

export default internalPurchaseOrderRouter
