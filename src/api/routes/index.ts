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
import workOrderRouter from './work-order.routes'
import inventoryMovementRouter from './inventory-movement.routes'
import inventoryReplenishmentRouter from './inventory-replenishment.routes'
import internalPurchaseOrderRouter from './internal-purchase-order.routes'
import deliveryReceiptRouter from './delivery-receipt.routes'
import workOrderStatusCatalogRouter from './work-order-status-catalog.routes'
import workOrderServiceTypeRouter from './work-order-service-type.routes'
import activityLogRouter from './activity-log.routes'
import reportRouter from './report.routes'
import dashboardRouter from './dashboard.routes'

const publicRoutes: Router[] = [authRouter]
const privateRoutes: Router[] = [
  menuOptionRouter,
  roleRouter,
  customerRouter,
  vehicleRouter,
  articleRouter,
  workOrderRouter,
  inventoryMovementRouter,
  inventoryReplenishmentRouter,
  internalPurchaseOrderRouter,
  deliveryReceiptRouter,
  workOrderStatusCatalogRouter,
  workOrderServiceTypeRouter,
  activityLogRouter,
  reportRouter,
  dashboardRouter,
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
