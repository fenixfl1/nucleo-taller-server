import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { ReportService } from '@api/services/report.service'

const reportService = new ReportService()

export const getOperationalReportController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reportService.getOperationalReport(request.body || {})
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
