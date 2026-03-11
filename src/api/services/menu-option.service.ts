import { Repository } from 'typeorm'
import { BaseService, CatchServiceError } from './base.service'
import { MenuOption } from '@entity/MenuOption'
import {
  AdvancedCondition,
  ApiResponse,
  Pagination,
  SessionInfo,
} from '@src/types/api.types'
import { NotFoundError } from '@api/errors/http.error'
import { paginatedQuery } from '@src/helpers/query-utils'
import { whereClauseBuilder } from '@src/helpers/where-clausure-builder'
import { preparePaginationConditions } from '@src/helpers/prepare-pagination-conditions'
import { getPermissionIdFromMenuOptionId } from '@helpers/menu-permission'

interface OptionWithPermission {
  MENU_OPTION_ID: string
  NAME: string
  DESCRIPTION?: string
  PATH?: string
  TYPE?: string
  STATE?: string | null
  ORDER: number
  PARENT_ID?: string | null
  CONTENT?: string
  PERMISSIONS: Array<{
    PERMISSION_ID: number
    DESCRIPTION: string
    ACTION_ID: number
    ACTION_NAME: string
  }>
}

export class MenuOptionService extends BaseService {
  private menuOptionRepository: Repository<MenuOption>

  constructor() {
    super()
    this.menuOptionRepository = this.datasource.getRepository(MenuOption)
  }

  @CatchServiceError()
  async create(
    payload: MenuOption,
    session: SessionInfo
  ): Promise<ApiResponse<MenuOption>> {
    const { PARENT_ID, PATH = '' } = payload
    const user = await this.getStaff(session.userId)

    let parent: MenuOption | null = null
    if (PARENT_ID) {
      parent = await this.menuOptionRepository.findOneBy({
        MENU_OPTION_ID: PARENT_ID,
      })
      if (!parent) {
        throw new NotFoundError(`Menu padre '${PARENT_ID}' no encontrado.`)
      }
    }

    const id = await this.getNextMenuOptionId(PARENT_ID)

    const menuOption = this.menuOptionRepository.create({
      ...payload,
      PATH: `/${id}${PATH}`,
      CREATOR: user,
      PARENT: parent ?? undefined,
      MENU_OPTION_ID: id,
      CREATED_AT: new Date(),
    })

    await this.menuOptionRepository.save(menuOption)

    return this.success({ data: menuOption })
  }

  @CatchServiceError()
  async update(payload: MenuOption): Promise<ApiResponse> {
    const { MENU_OPTION_ID, ...restProps } = payload

    const option = await this.menuOptionRepository.findOneBy({ MENU_OPTION_ID })
    if (!option) {
      throw new NotFoundError(
        `Opcion de menu con id '${MENU_OPTION_ID}' no existe.`
      )
    }

    await this.menuOptionRepository.update({ MENU_OPTION_ID }, { ...restProps })

    return this.success({ message: 'Opcion de menu actualizada exitosamente.' })
  }

  @CatchServiceError()
  async get(username: string): Promise<ApiResponse<MenuOption[]>> {
    const staff = await this.staffRepository.findOne({
      where: { USERNAME: username, STATE: 'A' as never },
      relations: ['ROLE', 'ROLE.MENU_OPTIONS', 'ROLE.MENU_OPTIONS.PARENT'],
    })

    if (!staff) {
      throw new NotFoundError(`Usuario '${username}' no encontrado.`)
    }

    const roleMenuOptions = (staff.ROLE?.MENU_OPTIONS || [])
      .filter((item) => item.STATE === 'A')
      .sort((a, b) => a.ORDER - b.ORDER)

    const menuMap = new Map<string, MenuOption & { CHILDREN: MenuOption[] }>()

    roleMenuOptions.forEach((menu) => {
      const current = menu as MenuOption & { CHILDREN: MenuOption[] }
      current.CHILDREN = []
      menuMap.set(menu.MENU_OPTION_ID, current)
    })

    const menuTree: MenuOption[] = []

    roleMenuOptions.forEach((menu) => {
      const current = menuMap.get(menu.MENU_OPTION_ID)
      const parentId = menu.PARENT_ID

      if (!current) return

      if (!parentId || !menuMap.has(parentId)) {
        menuTree.push(current)
        return
      }

      const parent = menuMap.get(parentId)
      parent?.CHILDREN.push(current)
    })

    const sortTree = (items: MenuOption[]) => {
      items.sort((a, b) => (a.ORDER || 0) - (b.ORDER || 0))
      items.forEach((item) => {
        if (item.CHILDREN?.length) {
          sortTree(item.CHILDREN)
        }
      })
    }

    sortTree(menuTree)

    return this.success({ data: menuTree })
  }

  @CatchServiceError()
  async getWithPermissions(
    conditions: AdvancedCondition<MenuOption>[] = [],
    pagination: Pagination
  ): Promise<ApiResponse<OptionWithPermission[]>> {
    const normalizedConditions = preparePaginationConditions(conditions, [
      'MENU_OPTION_ID',
      'NAME',
      'DESCRIPTION',
      'PATH',
      'TYPE',
      'CONTENT',
      'PARENT_ID',
    ])
    const { whereClause, values } = whereClauseBuilder(
      normalizedConditions as AdvancedCondition<Record<string, unknown>>[]
    )
    const statement = `
      SELECT
        "MENU_OPTION_ID",
        "NAME",
        "DESCRIPTION",
        "PATH",
        "TYPE",
        "STATE",
        "ORDER",
        "PARENT_ID",
        "CONTENT"
      FROM (
        SELECT
          "MENU_OPTION_ID",
          "NAME",
          "DESCRIPTION",
          "PATH",
          "TYPE",
          "STATE",
          "ORDER",
          "PARENT_ID",
          "CONTENT"
        FROM "MENU_OPTION"
        WHERE "STATE" = 'A'
      ) AS "menu_option_rows"
      ${whereClause}
      ORDER BY "ORDER" ASC, "MENU_OPTION_ID" ASC
    `
    const [data, metadata] = await paginatedQuery<MenuOption>({
      statement,
      values,
      pagination,
    })

    const optionsWithPermissions: OptionWithPermission[] = data.map((item) => {
      const permissionId = getPermissionIdFromMenuOptionId(item.MENU_OPTION_ID)

      return {
        MENU_OPTION_ID: item.MENU_OPTION_ID,
        NAME: item.NAME,
        DESCRIPTION: item.DESCRIPTION,
        PATH: item.PATH,
        TYPE: item.TYPE,
        STATE: item.STATE,
        ORDER: item.ORDER,
        PARENT_ID: item.PARENT_ID,
        CONTENT: item.CONTENT,
        PERMISSIONS: [
          {
            PERMISSION_ID: permissionId,
            DESCRIPTION: `Acceso a ${item.NAME}`,
            ACTION_ID: 1,
            ACTION_NAME: 'VIEW',
          },
        ],
      }
    })

    return this.success({ data: optionsWithPermissions, metadata })
  }

  @CatchServiceError()
  private async getNextMenuOptionId(parentId?: string): Promise<string> {
    if (parentId) {
      const parent = await this.menuOptionRepository.findOne({
        select: ['MENU_OPTION_ID'],
        relations: ['CHILDREN'],
        where: {
          MENU_OPTION_ID: parentId,
        },
      })

      if (!parent) {
        throw new NotFoundError(`Menu padre '${parentId}' no encontrado.`)
      }

      return `${parentId}-${parent.CHILDREN?.length + 1}`
    }

    const options = await this.menuOptionRepository.find({
      where: { PARENT_ID: null as never },
    })
    return `0-${options.length + 1}`
  }
}
