import { clampHomeMenuIndex } from '../navigation/navigationState'
import { HOME_MENU_ITEMS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createHomeTextObjects(navigationState: NavigationState) {
  const selectedMenuIndex = clampHomeMenuIndex(navigationState.selectedMenuIndex)

  return createSelectableListTextObjects({
    title: 'LeetLens',
    items: [...HOME_MENU_ITEMS],
    selectedIndex: selectedMenuIndex,
    itemNamePrefix: 'home',
    formatItem: (item) => item.label,
    maxVisibleItems: 7,
  })
}
