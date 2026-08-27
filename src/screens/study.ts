import type { NavigationState } from '../types/navigation'
import { STUDY_MENU_ITEMS } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createStudyTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'Study',
    items: [...STUDY_MENU_ITEMS],
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'study',
    formatItem: (item) => item.label,
  })
}
