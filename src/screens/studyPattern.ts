import { getPatterns } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createStudyPatternTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'Study By Pattern',
    items: getPatterns(),
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'study-pattern',
    formatItem: (pattern) => pattern,
    emptyMessage: 'NO PATTERNS FOUND',
    maxTitleLength: 31,
  })
}
