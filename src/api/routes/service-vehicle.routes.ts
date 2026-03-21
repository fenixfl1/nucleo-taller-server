import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createServiceVehicleSchema,
  updateServiceVehicleSchema,
  serviceVehicleIdParamsSchema,
} from '@api/validators/service-vehicle.schema'
import {
  createServiceVehicleController,
  getOneServiceVehicleController,
  getServiceVehiclePaginationController,
  updateServiceVehicleController,
} from '@api/controllers/service-vehicle.controller'
import {
  PATH_SERVICE_VEHICLE,
  PATH_SERVICE_VEHICLE_BY_ID,
  PATH_SERVICE_VEHICLE_PAGINATION,
} from '@src/constants/routes'

const serviceVehicleRouter = Router()

serviceVehicleRouter.post(
  PATH_SERVICE_VEHICLE,
  validateSchema(createServiceVehicleSchema),
  createServiceVehicleController
)
serviceVehicleRouter.put(
  PATH_SERVICE_VEHICLE,
  validateSchema(updateServiceVehicleSchema),
  updateServiceVehicleController
)
serviceVehicleRouter.post(
  PATH_SERVICE_VEHICLE_PAGINATION,
  validateSchema(advancedConditionSchema),
  getServiceVehiclePaginationController
)
serviceVehicleRouter.get(
  PATH_SERVICE_VEHICLE_BY_ID,
  validateSchema(serviceVehicleIdParamsSchema, 'params'),
  getOneServiceVehicleController
)

export default serviceVehicleRouter
