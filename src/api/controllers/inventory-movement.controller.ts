import { NextFunction, Request, Response } from 'express'
import { InventoryMovement } from '@entity/InventoryMovement'
import { InventoryMovementService } from '@api/services/inventory-movement.service'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'

const inventoryMovementService = new InventoryMovementService()

export const createInventoryMovementController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await inventoryMovementService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneInventoryMovementController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const movementId = Number(request.params.movementId)
    const result = await inventoryMovementService.getOne(movementId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getInventoryMovementPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<InventoryMovement>[]
    const result = await inventoryMovementService.getPagination(
      conditions,
      pagination
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getInventoryMovementTypeListController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await inventoryMovementService.getMovementTypeList()
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
