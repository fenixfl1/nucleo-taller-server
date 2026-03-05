import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { Staff } from '@entity/Staff'
import { StaffService } from '@api/services/staff.service'

const staffService = new StaffService()

export const createStaffAccessController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await staffService.createAccess(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateStaffAccessController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await staffService.updateAccess(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneStaffAccessController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await staffService.getAccessByUsername(
      String(request.params.username)
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getStaffAccessPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<Staff>[]
    const result = await staffService.getAccessPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const changeStaffAccessPasswordController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await staffService.changeAccessPassword(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
