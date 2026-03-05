import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  createPersonSchema,
  personIdParamsSchema,
  updatePersonSchema,
  validateIdentityDocumentSchema,
} from '@api/validators/person.schema'
import {
  createPersonController,
  getOnePersonController,
  getPersonPaginationController,
  updatePersonController,
  validatePersonIdentityDocumentController,
} from '@api/controllers/person.controller'
import {
  PATH_PERSON,
  PATH_PERSON_BY_ID,
  PATH_PERSON_PAGINATION,
  PATH_PERSON_VALIDATE_IDENTITY,
} from '@src/constants/routes'

const personRouter = Router()

personRouter.post(
  PATH_PERSON,
  validateSchema(createPersonSchema),
  createPersonController
)
personRouter.put(
  PATH_PERSON,
  validateSchema(updatePersonSchema),
  updatePersonController
)
personRouter.post(
  PATH_PERSON_PAGINATION,
  validateSchema(advancedConditionSchema),
  getPersonPaginationController
)
personRouter.get(
  PATH_PERSON_VALIDATE_IDENTITY,
  validateSchema(validateIdentityDocumentSchema, 'query'),
  validatePersonIdentityDocumentController
)
personRouter.get(
  PATH_PERSON_BY_ID,
  validateSchema(personIdParamsSchema, 'params'),
  getOnePersonController
)

export default personRouter
