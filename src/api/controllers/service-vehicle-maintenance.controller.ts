import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { ServiceVehicleMaintenance } from '@entity/ServiceVehicleMaintenance'
import { ServiceVehicleMaintenanceService } from '@api/services/service-vehicle-maintenance.service'

const serviceVehicleMaintenanceService = new ServiceVehicleMaintenanceService()

export const createServiceVehicleMaintenanceController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await serviceVehicleMaintenanceService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateServiceVehicleMaintenanceController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await serviceVehicleMaintenanceService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneServiceVehicleMaintenanceController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const serviceVehicleMaintenanceId = Number(
      request.params.serviceVehicleMaintenanceId
    )
    const result = await serviceVehicleMaintenanceService.getOne(
      serviceVehicleMaintenanceId
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getServiceVehicleMaintenancePaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions =
      (request.body || []) as AdvancedCondition<ServiceVehicleMaintenance>[]
    const result = await serviceVehicleMaintenanceService.getPagination(
      conditions,
      pagination
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
