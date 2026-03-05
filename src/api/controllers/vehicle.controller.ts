import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { Vehicle } from '@entity/Vehicle'
import { VehicleService } from '@api/services/vehicle.service'

const vehicleService = new VehicleService()

export const createVehicleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await vehicleService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateVehicleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await vehicleService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneVehicleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vehicleId = Number(request.params.vehicleId)
    const result = await vehicleService.getOne(vehicleId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getVehiclePaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<Vehicle>[]
    const result = await vehicleService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
