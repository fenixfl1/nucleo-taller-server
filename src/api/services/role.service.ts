import { BaseService, CatchServiceError } from './base.service'
import { Role } from '@entity/Role'
import { MenuOption } from '@entity/MenuOption'
import { MenuOptionRole } from '@entity/MenuOptionRoles'
import {
  ApiResponse,
  AdvancedCondition,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import {
  BadRequestError,
  DbConflictError,
  NotFoundError,
} from '@api/errors/http.error'
import { Repository } from 'typeorm'
import { paginatedQuery } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'
import {
  buildPermissionMapFromMenuOptions,
  getPermissionIdFromMenuOptionId,
} from '@helpers/menu-permission'

type RolePayload = {
  ROLE_ID?: number
  NAME?: string
  DESCRIPTION?: string
  STATE?: string
  PERMISSIONS?: number[]
}

interface RoleResponse extends Partial<Role> {
  PERMISSIONS: number[]
}

export class RoleService extends BaseService {
  private roleRepository: Repository<Role>
  private menuOptionRepository: Repository<MenuOption>
  private menuOptionRoleRepository: Repository<MenuOptionRole>

  constructor() {
    super()
    this.roleRepository = this.datasource.getRepository(Role)
    this.menuOptionRepository = this.datasource.getRepository(MenuOption)
    this.menuOptionRoleRepository = this.datasource.getRepository(MenuOptionRole)
  }

  @CatchServiceError()
  async create(
    payload: RolePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<RoleResponse>> {
    const { NAME, DESCRIPTION, STATE = 'A', PERMISSIONS = [] } = payload

    if (!NAME?.trim()) {
      throw new BadRequestError('El nombre del rol es requerido.')
    }

    const existingRole = await this.roleRepository.findOneBy({
      NAME: NAME.trim(),
    })

    if (existingRole) {
      throw new DbConflictError(`El rol '${NAME.trim()}' ya existe.`)
    }

    const role = this.roleRepository.create({
      NAME: NAME.trim(),
      DESCRIPTION: DESCRIPTION?.trim() || '',
      STATE,
      CREATED_BY: sessionInfo.userId,
    })

    const savedRole = await this.roleRepository.save(role)
    await this.syncRolePermissions(savedRole.ROLE_ID, PERMISSIONS, sessionInfo)

    return this.success({
      data: {
        ...savedRole,
        PERMISSIONS,
      },
    })
  }

  @CatchServiceError()
  async update(
    payload: RolePayload,
    sessionInfo: SessionInfo
  ): Promise<ApiResponse<RoleResponse>> {
    const { ROLE_ID, NAME, DESCRIPTION, STATE, PERMISSIONS } = payload

    if (!ROLE_ID) {
      throw new BadRequestError('El campo ROLE_ID es requerido.')
    }

    const role = await this.roleRepository.findOneBy({ ROLE_ID })
    if (!role) {
      throw new NotFoundError(`Rol con id '${ROLE_ID}' no encontrado.`)
    }

    if (NAME?.trim() && NAME.trim() !== role.NAME) {
      const exists = await this.roleRepository.findOneBy({ NAME: NAME.trim() })
      if (exists) {
        throw new DbConflictError(`El rol '${NAME.trim()}' ya existe.`)
      }
      role.NAME = NAME.trim()
    }

    if (typeof DESCRIPTION === 'string') {
      role.DESCRIPTION = DESCRIPTION.trim()
    }

    if (STATE) {
      role.STATE = STATE
    }

    role.UPDATED_BY = sessionInfo.userId
    const savedRole = await this.roleRepository.save(role)

    if (Array.isArray(PERMISSIONS)) {
      await this.syncRolePermissions(savedRole.ROLE_ID, PERMISSIONS, sessionInfo)
    }

    const currentPermissions = await this.getRolePermissions(savedRole.ROLE_ID)

    return this.success({
      data: {
        ...savedRole,
        PERMISSIONS: currentPermissions,
      },
    })
  }

  @CatchServiceError()
  async getOne(roleId: number): Promise<ApiResponse<RoleResponse>> {
    const role = await this.roleRepository.findOneBy({ ROLE_ID: roleId })
    if (!role) {
      throw new NotFoundError(`Rol con id '${roleId}' no encontrado.`)
    }

    const permissions = await this.getRolePermissions(roleId)

    return this.success({
      data: {
        ...role,
        PERMISSIONS: permissions,
      },
    })
  }

  @CatchServiceError()
  async getPagination(
    conditions: AdvancedCondition<Role>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<RoleResponse[]>> {
    const normalizedConditions = preparePaginationConditions(conditions, [
      'ROLE_ID',
      'NAME',
      'DESCRIPTION',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "ROLE_ID",
        "NAME",
        "DESCRIPTION",
        "STATE",
        "CREATED_AT"
      FROM (
        SELECT
          "ROLE_ID",
          "NAME",
          "DESCRIPTION",
          "STATE",
          "CREATED_AT"
        FROM "ROLES"
      ) AS "role_rows"
      ${whereClause}
      ORDER BY "ROLE_ID" DESC
    `
    const [data, metadata] = await paginatedQuery<Role>({
      statement,
      values,
      pagination,
    })

    const rows: RoleResponse[] = data.map((item) => ({
      ...item,
      PERMISSIONS: [],
    }))

    return this.success({ data: rows, metadata })
  }

  private async syncRolePermissions(
    roleId: number,
    permissionIds: number[],
    sessionInfo: SessionInfo
  ): Promise<void> {
    const uniquePermissionIds = Array.from(
      new Set((permissionIds || []).map((value) => Number(value)))
    ).filter((value) => Number.isFinite(value))

    const menuOptions = await this.menuOptionRepository.find({
      where: { STATE: 'A' as never },
    })
    const permissionMap = buildPermissionMapFromMenuOptions(menuOptions)

    const unknownPermissions = uniquePermissionIds.filter(
      (permissionId) => !permissionMap.has(permissionId)
    )

    if (unknownPermissions.length) {
      throw new BadRequestError(
        `Permisos inválidos: ${unknownPermissions.join(', ')}.`
      )
    }

    const selectedMenuIds = new Set(
      uniquePermissionIds
        .map((permissionId) => permissionMap.get(permissionId)?.MENU_OPTION_ID)
        .filter(Boolean)
    )

    const currentLinks = await this.menuOptionRoleRepository.find({
      where: { ROLE_ID: roleId },
    })

    for (const link of currentLinks) {
      if (selectedMenuIds.has(link.MENU_OPTION_ID)) {
        if (link.STATE !== 'A') {
          link.STATE = 'A'
          link.UPDATED_BY = sessionInfo.userId
          await this.menuOptionRoleRepository.save(link)
        }
        selectedMenuIds.delete(link.MENU_OPTION_ID)
      } else if (link.STATE !== 'I') {
        link.STATE = 'I'
        link.UPDATED_BY = sessionInfo.userId
        await this.menuOptionRoleRepository.save(link)
      }
    }

    for (const menuOptionId of selectedMenuIds) {
      const rolePermission = this.menuOptionRoleRepository.create({
        ROLE_ID: roleId,
        MENU_OPTION_ID: menuOptionId,
        STATE: 'A',
        CREATED_BY: sessionInfo.userId,
      })

      await this.menuOptionRoleRepository.save(rolePermission)
    }
  }

  private async getRolePermissions(roleId: number): Promise<number[]> {
    const rolePermissions = await this.menuOptionRoleRepository.find({
      where: { ROLE_ID: roleId, STATE: 'A' as never },
    })

    return rolePermissions.map((item) =>
      getPermissionIdFromMenuOptionId(item.MENU_OPTION_ID)
    )
  }
}
