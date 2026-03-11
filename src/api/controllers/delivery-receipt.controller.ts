import { NextFunction, Request, Response } from 'express'
import { DeliveryReceipt } from '@entity/DeliveryReceipt'
import { DeliveryReceiptService } from '@api/services/delivery-receipt.service'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'

const deliveryReceiptService = new DeliveryReceiptService()

export const createDeliveryReceiptController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deliveryReceiptService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneDeliveryReceiptController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const receiptId = Number(request.params.receiptId)
    const result = await deliveryReceiptService.getOne(receiptId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getDeliveryReceiptPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<DeliveryReceipt>[]
    const result = await deliveryReceiptService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
