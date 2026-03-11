import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { DashboardService } from '@api/services/dashboard.service'

const dashboardService = new DashboardService()

export const getDashboardSummaryController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await dashboardService.getWorkshopSnapshot(
      request['sessionInfo']
    )

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
