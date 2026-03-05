import { PM2_CONNECTION_ERROR } from '@constants/error-types'
import { BaseError } from './base.error'
import { HTTP_STATUS_BAD_REQUEST } from '@constants/status-codes'

export class ConnectionError extends BaseError {
  constructor(message: string) {
    super(HTTP_STATUS_BAD_REQUEST, message, PM2_CONNECTION_ERROR)
  }
}
