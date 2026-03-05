import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { Person } from '@entity/Person'
import { PersonService } from '@api/services/person.service'

const personService = new PersonService()

export const createPersonController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await personService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updatePersonController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await personService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOnePersonController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const personId = Number(request.params.personId)
    const result = await personService.getOne(personId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getPersonPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<Person>[]
    const result = await personService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const validatePersonIdentityDocumentController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identityDocument } = request.query as { identityDocument: string }
    const result = await personService.validateIdentityDocument(identityDocument)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
