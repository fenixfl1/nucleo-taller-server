import { HTTP_STATUS_UNAUTHORIZED } from '@constants/status-codes'
import { Request, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { asyncLocalStorage } from './storage.middleware'
import { UNAUTHORIZED_ERROR_MESSAGE } from '@constants/messages'

const authMiddleware = (req: Request, res: any, next: NextFunction) => {
  const token = req.headers.authorization

  if (!token) {
    return res
      .status(HTTP_STATUS_UNAUTHORIZED)
      .json({ message: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req['sessionInfo'] = decoded as never
    asyncLocalStorage.run(decoded as never, () => {
      next()
    })
  } catch (error) {
    return res
      .status(HTTP_STATUS_UNAUTHORIZED)
      .json({ message: UNAUTHORIZED_ERROR_MESSAGE })
  }
}

export default authMiddleware
