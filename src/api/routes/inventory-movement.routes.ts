import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createInventoryMovementController,
  getInventoryMovementPaginationController,
  getInventoryMovementTypeListController,
  getOneInventoryMovementController,
} from '@api/controllers/inventory-movement.controller'
import {
  createInventoryMovementSchema,
  inventoryMovementIdParamsSchema,
} from '@api/validators/inventory-movement.schema'
import {
  PATH_INVENTORY_MOVEMENT,
  PATH_INVENTORY_MOVEMENT_BY_ID,
  PATH_INVENTORY_MOVEMENT_PAGINATION,
  PATH_INVENTORY_MOVEMENT_TYPE_LIST,
} from '@src/constants/routes'

const inventoryMovementRouter = Router()

inventoryMovementRouter.get(
  PATH_INVENTORY_MOVEMENT_TYPE_LIST,
  getInventoryMovementTypeListController
)
inventoryMovementRouter.post(
  PATH_INVENTORY_MOVEMENT,
  validateSchema(createInventoryMovementSchema),
  createInventoryMovementController
)
inventoryMovementRouter.post(
  PATH_INVENTORY_MOVEMENT_PAGINATION,
  validateSchema(advancedConditionSchema),
  getInventoryMovementPaginationController
)
inventoryMovementRouter.get(
  PATH_INVENTORY_MOVEMENT_BY_ID,
  validateSchema(inventoryMovementIdParamsSchema, 'params'),
  getOneInventoryMovementController
)

export default inventoryMovementRouter
