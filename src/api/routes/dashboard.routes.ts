import { Router } from 'express'
import { getDashboardSummaryController } from '@api/controllers/dashboard.controller'
import { PATH_DASHBOARD_SUMMARY } from '@src/constants/routes'

const dashboardRouter = Router()

dashboardRouter.get(PATH_DASHBOARD_SUMMARY, getDashboardSummaryController)

export default dashboardRouter
