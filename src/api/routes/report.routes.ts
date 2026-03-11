import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { getOperationalReportController } from '@api/controllers/report.controller'
import { operationalReportSchema } from '@api/validators/report.schema'
import { PATH_REPORT_OPERATIONAL } from '@src/constants/routes'

const reportRouter = Router()

reportRouter.post(
  PATH_REPORT_OPERATIONAL,
  validateSchema(operationalReportSchema),
  getOperationalReportController
)

export default reportRouter
