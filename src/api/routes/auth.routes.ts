import { Router } from 'express'
import { validateSchema } from '../middlewares/validator-middleware'
import {
  loginController,
  requestPasswordResetController,
  resetPasswordController,
} from '../controllers/auth.controller'
import {
  authSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '@api/validators/auth.schema'
import {
  PATH_LOGIN,
  PATH_REQUEST_RESET_PASSWORD,
  PATH_RESET_PASSWORD,
} from '@src/constants/routes'

const authRouter = Router()

authRouter.post(PATH_LOGIN, validateSchema(authSchema), loginController)
authRouter.post(
  PATH_RESET_PASSWORD,
  validateSchema(resetPasswordSchema),
  resetPasswordController
)
authRouter.post(
  PATH_REQUEST_RESET_PASSWORD,
  validateSchema(requestPasswordResetSchema),
  requestPasswordResetController
)

export default authRouter
