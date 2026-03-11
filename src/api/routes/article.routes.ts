import { Router } from 'express'
import { validateSchema } from '@api/middlewares/validator-middleware'
import { advancedConditionSchema } from '@api/validators/condition.schema'
import {
  articleIdParamsSchema,
  compatibleArticleByVehicleParamsSchema,
  createArticleSchema,
  updateArticleSchema,
} from '@api/validators/article.schema'
import {
  createArticleController,
  getCompatibleArticlesByVehicleController,
  getArticlePaginationController,
  getOneArticleController,
  updateArticleController,
} from '@api/controllers/article.controller'
import {
  PATH_ARTICLE,
  PATH_ARTICLE_BY_ID,
  PATH_ARTICLE_COMPATIBLE_BY_VEHICLE,
  PATH_ARTICLE_PAGINATION,
} from '@src/constants/routes'

const articleRouter = Router()

articleRouter.post(
  PATH_ARTICLE,
  validateSchema(createArticleSchema),
  createArticleController
)
articleRouter.put(
  PATH_ARTICLE,
  validateSchema(updateArticleSchema),
  updateArticleController
)
articleRouter.post(
  PATH_ARTICLE_PAGINATION,
  validateSchema(advancedConditionSchema),
  getArticlePaginationController
)
articleRouter.get(
  PATH_ARTICLE_COMPATIBLE_BY_VEHICLE,
  validateSchema(compatibleArticleByVehicleParamsSchema, 'params'),
  getCompatibleArticlesByVehicleController
)
articleRouter.get(
  PATH_ARTICLE_BY_ID,
  validateSchema(articleIdParamsSchema, 'params'),
  getOneArticleController
)

export default articleRouter
