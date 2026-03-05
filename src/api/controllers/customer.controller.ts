import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { Person } from '@entity/Person'
import { CustomerService } from '@api/services/customer.service'

const customerService = new CustomerService()

export const createCustomerController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await customerService.create(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateCustomerController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await customerService.update(
      request.body,
      request['sessionInfo']
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneCustomerController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = Number(request.params.customerId)
    const result = await customerService.getOne(customerId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getCustomerPaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<Person>[]
    const result = await customerService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const validateCustomerIdentityDocumentController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identityDocument } = request.query as { identityDocument: string }
    const result = await customerService.validateIdentityDocument(
      identityDocument
    )
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
