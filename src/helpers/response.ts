import { Response } from 'express'
import { HTTP_STATUS_OK } from '@constants/status-codes'
import { ApiResponse } from '@src/types/api.types'

export const sendResponse = <T>(
  res: Response,
  data: ApiResponse<T>,
  status?: number
): void => {
  const _status = data.status
  delete data.status
  res.status(status ?? _status).send({ ...data })
}
