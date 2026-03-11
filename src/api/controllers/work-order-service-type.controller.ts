import { NextFunction, Request, Response } from 'express'
import { WorkOrderServiceType } from '@entity/WorkOrderServiceType'
import { WorkOrderServiceTypeService } from '@api/services/work-order-service-type.service'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'

const workOrderServiceTypeService = new WorkOrderServiceTypeService()

export const createWorkOrderServiceTypeController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderServiceTypeService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateWorkOrderServiceTypeController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderServiceTypeService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneWorkOrderServiceTypeController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const serviceTypeId = Number(request.params.serviceTypeId)
    const result = await workOrderServiceTypeService.getOne(serviceTypeId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getWorkOrderServiceTypePaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<WorkOrderServiceType>[]
    const result = await workOrderServiceTypeService.getPagination(
      conditions,
      pagination
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getWorkOrderServiceTypeListController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderServiceTypeService.getList()
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
