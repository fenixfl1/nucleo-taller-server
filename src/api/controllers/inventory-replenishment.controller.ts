import { NextFunction, Request, Response } from 'express'
import { Article } from '@entity/Article'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { InventoryReplenishmentService } from '@api/services/inventory-replenishment.service'

const inventoryReplenishmentService = new InventoryReplenishmentService()

export const getInventoryReplenishmentPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<Article>[]
    const months = Number(request.query.months || 3)
    const result = await inventoryReplenishmentService.getPagination(
      conditions,
      pagination,
      months
    )

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getInventoryReplenishmentSummaryController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conditions = (request.body || []) as AdvancedCondition<Article>[]
    const months = Number(request.query.months || 3)
    const result = await inventoryReplenishmentService.getSummary(
      conditions,
      months
    )

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
