import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamsSchema,
} from '@api/validators/vehicle.schema'
import {
  createVehicleController,
  getOneVehicleController,
  getVehiclePaginationController,
  updateVehicleController,
} from '@api/controllers/vehicle.controller'
import {
  PATH_VEHICLE,
  PATH_VEHICLE_BY_ID,
  PATH_VEHICLE_PAGINATION,
} from '@src/constants/routes'

const vehicleRouter = Router()

vehicleRouter.post(
  PATH_VEHICLE,
  validateSchema(createVehicleSchema),
  createVehicleController
)
vehicleRouter.put(
  PATH_VEHICLE,
  validateSchema(updateVehicleSchema),
  updateVehicleController
)
vehicleRouter.post(
  PATH_VEHICLE_PAGINATION,
  validateSchema(advancedConditionSchema),
  getVehiclePaginationController
)
vehicleRouter.get(
  PATH_VEHICLE_BY_ID,
  validateSchema(vehicleIdParamsSchema, 'params'),
  getOneVehicleController
)

export default vehicleRouter
