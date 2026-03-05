import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { Article } from '@entity/Article'
import { ArticleService } from '@api/services/article.service'

const articleService = new ArticleService()

export const createArticleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await articleService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateArticleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await articleService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneArticleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const articleId = Number(request.params.articleId)
    const result = await articleService.getOne(articleId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getArticlePaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<Article>[]
    const result = await articleService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
