import { HTTP_STATUS_UNAUTHORIZED } from '@constants/status-codes'
import { Request, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { asyncLocalStorage } from './storage.middleware'
import { UNAUTHORIZED_ERROR_MESSAGE } from '@constants/messages'
import { RequestContext, SessionInfo } from '@src/types/api.types'

const normalizeRequestIp = (req: Request): string | undefined => {
  const forwardedFor = req.headers['x-forwarded-for']
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]

  const rawIp =
    forwardedIp?.trim() || req.ip || req.socket.remoteAddress || undefined

  if (!rawIp) {
    return undefined
  }

  return rawIp.replace(/^::ffff:/, '')
}

const authMiddleware = (req: Request, res: any, next: NextFunction) => {
  const token = req.headers.authorization

  if (!token) {
    return res
      .status(HTTP_STATUS_UNAUTHORIZED)
      .json({ message: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SessionInfo
    const requestContext: RequestContext = {
      ...decoded,
      ip: normalizeRequestIp(req),
      userAgent: req.get('user-agent')?.trim() || undefined,
    }

    req['sessionInfo'] = requestContext as never
    asyncLocalStorage.run(requestContext, () => {
      next()
    })
  } catch (error) {
    return res
      .status(HTTP_STATUS_UNAUTHORIZED)
      .json({ message: UNAUTHORIZED_ERROR_MESSAGE })
  }
}

export default authMiddleware
