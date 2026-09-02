import { getPatterns } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

const PATTERN_ITEMS = getPatterns()

export function createPatternsTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'Patterns',
    items: PATTERN_ITEMS,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'pattern',
    formatItem: (pattern) => pattern,
    emptyMessage: 'NO PATTERNS FOUND',
  })
}
