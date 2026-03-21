import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createServiceVehicleMaintenanceSchema,
  serviceVehicleMaintenanceIdParamsSchema,
  updateServiceVehicleMaintenanceSchema,
} from '@api/validators/service-vehicle-maintenance.schema'
import {
  createServiceVehicleMaintenanceController,
  getOneServiceVehicleMaintenanceController,
  getServiceVehicleMaintenancePaginationController,
  updateServiceVehicleMaintenanceController,
} from '@api/controllers/service-vehicle-maintenance.controller'
import {
  PATH_SERVICE_VEHICLE_MAINTENANCE,
  PATH_SERVICE_VEHICLE_MAINTENANCE_BY_ID,
  PATH_SERVICE_VEHICLE_MAINTENANCE_PAGINATION,
} from '@src/constants/routes'

const serviceVehicleMaintenanceRouter = Router()

serviceVehicleMaintenanceRouter.post(
  PATH_SERVICE_VEHICLE_MAINTENANCE,
  validateSchema(createServiceVehicleMaintenanceSchema),
  createServiceVehicleMaintenanceController
)
serviceVehicleMaintenanceRouter.put(
  PATH_SERVICE_VEHICLE_MAINTENANCE,
  validateSchema(updateServiceVehicleMaintenanceSchema),
  updateServiceVehicleMaintenanceController
)
serviceVehicleMaintenanceRouter.post(
  PATH_SERVICE_VEHICLE_MAINTENANCE_PAGINATION,
  validateSchema(advancedConditionSchema),
  getServiceVehicleMaintenancePaginationController
)
serviceVehicleMaintenanceRouter.get(
  PATH_SERVICE_VEHICLE_MAINTENANCE_BY_ID,
  validateSchema(serviceVehicleMaintenanceIdParamsSchema, 'params'),
  getOneServiceVehicleMaintenanceController
)

export default serviceVehicleMaintenanceRouter
