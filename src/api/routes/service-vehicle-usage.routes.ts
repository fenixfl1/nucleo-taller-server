import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createServiceVehicleUsageSchema,
  serviceVehicleUsageIdParamsSchema,
  updateServiceVehicleUsageSchema,
} from '@api/validators/service-vehicle-usage.schema'
import {
  createServiceVehicleUsageController,
  getOneServiceVehicleUsageController,
  getServiceVehicleUsagePaginationController,
  updateServiceVehicleUsageController,
} from '@api/controllers/service-vehicle-usage.controller'
import {
  PATH_SERVICE_VEHICLE_USAGE,
  PATH_SERVICE_VEHICLE_USAGE_BY_ID,
  PATH_SERVICE_VEHICLE_USAGE_PAGINATION,
} from '@src/constants/routes'

const serviceVehicleUsageRouter = Router()

serviceVehicleUsageRouter.post(
  PATH_SERVICE_VEHICLE_USAGE,
  validateSchema(createServiceVehicleUsageSchema),
  createServiceVehicleUsageController
)
serviceVehicleUsageRouter.put(
  PATH_SERVICE_VEHICLE_USAGE,
  validateSchema(updateServiceVehicleUsageSchema),
  updateServiceVehicleUsageController
)
serviceVehicleUsageRouter.post(
  PATH_SERVICE_VEHICLE_USAGE_PAGINATION,
  validateSchema(advancedConditionSchema),
  getServiceVehicleUsagePaginationController
)
serviceVehicleUsageRouter.get(
  PATH_SERVICE_VEHICLE_USAGE_BY_ID,
  validateSchema(serviceVehicleUsageIdParamsSchema, 'params'),
  getOneServiceVehicleUsageController
)

export default serviceVehicleUsageRouter
