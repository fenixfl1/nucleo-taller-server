import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createDeliveryReceiptSchema,
  deliveryReceiptIdParamsSchema,
} from '@api/validators/delivery-receipt.schema'
import {
  createDeliveryReceiptController,
  getDeliveryReceiptPaginationController,
  getOneDeliveryReceiptController,
} from '@api/controllers/delivery-receipt.controller'
import {
  PATH_DELIVERY_RECEIPT,
  PATH_DELIVERY_RECEIPT_BY_ID,
  PATH_DELIVERY_RECEIPT_PAGINATION,
} from '@src/constants/routes'

const deliveryReceiptRouter = Router()

deliveryReceiptRouter.post(
  PATH_DELIVERY_RECEIPT,
  validateSchema(createDeliveryReceiptSchema),
  createDeliveryReceiptController
)
deliveryReceiptRouter.post(
  PATH_DELIVERY_RECEIPT_PAGINATION,
  validateSchema(advancedConditionSchema),
  getDeliveryReceiptPaginationController
)
deliveryReceiptRouter.get(
  PATH_DELIVERY_RECEIPT_BY_ID,
  validateSchema(deliveryReceiptIdParamsSchema, 'params'),
  getOneDeliveryReceiptController
)

export default deliveryReceiptRouter
