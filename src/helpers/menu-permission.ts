import { MenuOption } from '@entity/MenuOption'

/**
 * Generates a deterministic numeric id for a menu option.
 * The same MENU_OPTION_ID always maps to the same permission id.
 */
export const getPermissionIdFromMenuOptionId = (menuOptionId: string): number => {
  return Math.abs(
    menuOptionId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0
    }, 0)
  )
}

export const buildPermissionMapFromMenuOptions = (
  menuOptions: MenuOption[]
): Map<number, MenuOption> => {
  const map = new Map<number, MenuOption>()

  menuOptions.forEach((menu) => {
    map.set(getPermissionIdFromMenuOptionId(menu.MENU_OPTION_ID), menu)
  })

  return map
}
