import { NextFunction, Request, Response } from 'express'
import { WorkOrderStatus } from '@entity/WorkOrderStatus'
import { WorkOrderStatusCatalogService } from '@api/services/work-order-status-catalog.service'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'

const workOrderStatusCatalogService = new WorkOrderStatusCatalogService()

export const createWorkOrderStatusCatalogController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderStatusCatalogService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateWorkOrderStatusCatalogController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await workOrderStatusCatalogService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneWorkOrderStatusCatalogController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const statusId = Number(request.params.statusId)
    const result = await workOrderStatusCatalogService.getOne(statusId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getWorkOrderStatusCatalogPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<WorkOrderStatus>[]
    const result = await workOrderStatusCatalogService.getPagination(
      conditions,
      pagination
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
