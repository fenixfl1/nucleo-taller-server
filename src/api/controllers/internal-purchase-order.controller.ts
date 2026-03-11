import { NextFunction, Request, Response } from 'express'
import { InternalPurchaseOrderService } from '@api/services/internal-purchase-order.service'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { InternalPurchaseOrder } from '@entity/InternalPurchaseOrder'

const internalPurchaseOrderService = new InternalPurchaseOrderService()

export const createInternalPurchaseOrderController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await internalPurchaseOrderService.create(
      request.body,
      request['sessionInfo']
    )

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getInternalPurchaseOrderPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<InternalPurchaseOrder>[]
    const result = await internalPurchaseOrderService.getPagination(
      conditions,
      pagination
    )

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneInternalPurchaseOrderController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const internalPurchaseOrderId = Number(request.params.internalPurchaseOrderId)
    const result = await internalPurchaseOrderService.getOne(
      internalPurchaseOrderId
    )

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateInternalPurchaseOrderStatusController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await internalPurchaseOrderService.updateStatus(
      request.body,
      request['sessionInfo']
    )

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
