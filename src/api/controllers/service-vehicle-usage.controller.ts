import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { ServiceVehicleUsage } from '@entity/ServiceVehicleUsage'
import { ServiceVehicleUsageService } from '@api/services/service-vehicle-usage.service'

const serviceVehicleUsageService = new ServiceVehicleUsageService()

export const createServiceVehicleUsageController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await serviceVehicleUsageService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateServiceVehicleUsageController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await serviceVehicleUsageService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneServiceVehicleUsageController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const serviceVehicleUsageId = Number(request.params.serviceVehicleUsageId)
    const result = await serviceVehicleUsageService.getOne(serviceVehicleUsageId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getServiceVehicleUsagePaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<ServiceVehicleUsage>[]
    const result = await serviceVehicleUsageService.getPagination(
      conditions,
      pagination
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
