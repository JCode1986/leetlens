import { getPatterns } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

const STUDY_PATTERN_ITEMS = getPatterns()

export function createStudyPatternTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'Study By Pattern',
    items: STUDY_PATTERN_ITEMS,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'study-pattern',
    formatItem: (pattern) => pattern,
    emptyMessage: 'NO PATTERNS FOUND',
  })
}
