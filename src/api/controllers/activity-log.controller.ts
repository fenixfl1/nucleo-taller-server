import { NextFunction, Request, Response } from 'express'
import { ActivityLog } from '@entity/ActivityLog'
import { ActivityLogService } from '@api/services/activity-log.service'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'

const activityLogService = new ActivityLogService()

export const getActivityLogPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<ActivityLog>[]
    const result = await activityLogService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneActivityLogController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activityLogId = Number(request.params.activityLogId)
    const result = await activityLogService.getOne(activityLogId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
