import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { ServiceVehicle } from '@entity/ServiceVehicle'
import { ServiceVehicleService } from '@api/services/service-vehicle.service'

const serviceVehicleService = new ServiceVehicleService()

export const createServiceVehicleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await serviceVehicleService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateServiceVehicleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await serviceVehicleService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneServiceVehicleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const serviceVehicleId = Number(request.params.serviceVehicleId)
    const result = await serviceVehicleService.getOne(serviceVehicleId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getServiceVehiclePaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<ServiceVehicle>[]
    const result = await serviceVehicleService.getPagination(
      conditions,
      pagination
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
