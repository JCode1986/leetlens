import type { NavigationState } from '../types/navigation'
import { FIND_MENU_ITEMS } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createFindTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'Find',
    items: FIND_MENU_ITEMS,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'find',
    formatItem: (item) => item.label,
  })
}
