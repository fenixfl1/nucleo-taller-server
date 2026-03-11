import { NextFunction, Request, Response } from 'express'
import { WorkOrder } from '@entity/WorkOrder'
import { WorkOrderService } from '@api/services/work-order.service'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'

const workOrderService = new WorkOrderService()

export const createWorkOrderController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateWorkOrderController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneWorkOrderController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workOrderId = Number(request.params.workOrderId)
    const result = await workOrderService.getOne(workOrderId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getWorkOrderPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<WorkOrder>[]
    const result = await workOrderService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getWorkOrderStatusListController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderService.getStatusList()
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
