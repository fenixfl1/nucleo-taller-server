import { NextFunction, Request, Response } from 'express'
import { sendResponse } from '@helpers/response'
import { extractPagination } from '@src/helpers/extract-pagination'
import { AdvancedCondition } from '@src/types/api.types'
import { Role } from '@entity/Role'
import { RoleService } from '../services/role.service'

const roleService = new RoleService()

export const createRoleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await roleService.create(request.body, request['sessionInfo'])
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const updateRoleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await roleService.update(request.body, request['sessionInfo'])
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getOneRoleController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleId = Number(request.params.roleId)
    const result = await roleService.getOne(roleId)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}

export const getRolePaginationController = async (
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pagination = extractPagination(request.query)
    const conditions = (request.body || []) as AdvancedCondition<Role>[]
    const result = await roleService.getPagination(conditions, pagination)
    return sendResponse(res, result)
  } catch (error) {
    next(error)
  }
}
