import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  getInventoryReplenishmentPaginationController,
  getInventoryReplenishmentSummaryController,
} from '@api/controllers/inventory-replenishment.controller'
import {
  PATH_INVENTORY_REPLENISHMENT_PAGINATION,
  PATH_INVENTORY_REPLENISHMENT_SUMMARY,
} from '@src/constants/routes'

const inventoryReplenishmentRouter = Router()

inventoryReplenishmentRouter.post(
  PATH_INVENTORY_REPLENISHMENT_PAGINATION,
  validateSchema(advancedConditionSchema),
  getInventoryReplenishmentPaginationController
)

inventoryReplenishmentRouter.post(
  PATH_INVENTORY_REPLENISHMENT_SUMMARY,
  validateSchema(advancedConditionSchema),
  getInventoryReplenishmentSummaryController
)

export default inventoryReplenishmentRouter
