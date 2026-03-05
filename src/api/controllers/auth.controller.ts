import { sendResponse } from '@helpers/response'
import { NextFunction, Response, Request } from 'express'
import { AuthService } from '../services/auth.service'

const authService = new AuthService()

export const loginController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(request.body)

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const requestPasswordResetController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { EMAIL, USERNAME } = request.body
    const result = await authService.requestPasswordReset(EMAIL, USERNAME)

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const resetPasswordController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = request.body
    const result = await authService.resetPassword(token, password)

    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
