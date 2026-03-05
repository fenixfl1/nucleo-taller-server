import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createCustomerSchema,
  customerIdParamsSchema,
  updateCustomerSchema,
  validateCustomerIdentityDocumentSchema,
} from '@api/validators/customer.schema'
import {
  createCustomerController,
  getCustomerPaginationController,
  getOneCustomerController,
  updateCustomerController,
  validateCustomerIdentityDocumentController,
} from '@api/controllers/customer.controller'
import {
  PATH_CUSTOMER,
  PATH_CUSTOMER_BY_ID,
  PATH_CUSTOMER_PAGINATION,
  PATH_CUSTOMER_VALIDATE_IDENTITY,
} from '@src/constants/routes'

const customerRouter = Router()

customerRouter.post(
  PATH_CUSTOMER,
  validateSchema(createCustomerSchema),
  createCustomerController
)
customerRouter.put(
  PATH_CUSTOMER,
  validateSchema(updateCustomerSchema),
  updateCustomerController
)
customerRouter.post(
  PATH_CUSTOMER_PAGINATION,
  validateSchema(advancedConditionSchema),
  getCustomerPaginationController
)
customerRouter.get(
  PATH_CUSTOMER_VALIDATE_IDENTITY,
  validateSchema(validateCustomerIdentityDocumentSchema, 'query'),
  validateCustomerIdentityDocumentController
)
customerRouter.get(
  PATH_CUSTOMER_BY_ID,
  validateSchema(customerIdParamsSchema, 'params'),
  getOneCustomerController
)

export default customerRouter
