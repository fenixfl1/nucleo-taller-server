import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import { createRoleSchema, updateRoleSchema } from '@api/validators/role.schema'
import {
  createRoleController,
  getOneRoleController,
  getRolePaginationController,
  updateRoleController,
} from '@api/controllers/role.controller'
import {
  PATH_ROLE,
  PATH_ROLE_BY_ID,
  PATH_ROLE_PAGINATION,
} from '@src/constants/routes'

const roleRouter = Router()

roleRouter.post(PATH_ROLE, validateSchema(createRoleSchema), createRoleController)
roleRouter.put(PATH_ROLE, validateSchema(updateRoleSchema), updateRoleController)
roleRouter.get(PATH_ROLE_BY_ID, getOneRoleController)
roleRouter.post(
  PATH_ROLE_PAGINATION,
  validateSchema(advancedConditionSchema),
  getRolePaginationController
)

export default roleRouter
