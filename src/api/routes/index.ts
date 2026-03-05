import authMiddleware from '@middlewares/auth.middleware'
import { Router } from 'express'
import authRouter from './auth.routes'
import menuOptionRouter from './menu-option.routes'
import roleRouter from './role.routes'
import personRouter from './person.routes'
import staffAccessRouter from './staff-access.routes'
import customerRouter from './customer.routes'
import vehicleRouter from './vehicle.routes'
import articleRouter from './article.routes'

const publicRoutes: Router[] = [authRouter]
const privateRoutes: Router[] = [
  menuOptionRouter,
  roleRouter,
  customerRouter,
  vehicleRouter,
  articleRouter,
  personRouter,
  staffAccessRouter,
]

const routes = Router() as any
const publicRouter = Router() as any
const privateRouter = Router() as any

privateRouter.use(authMiddleware)

privateRoutes.forEach((route) => {
  privateRouter.use(route)
})

publicRouter.use(publicRoutes)

routes.use([publicRouter, privateRouter])

export default routes
