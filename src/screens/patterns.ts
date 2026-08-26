import { getPatterns } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createPatternsTextObjects(state: NavigationState) {
  const patterns = getPatterns()

  return createSelectableListTextObjects({
    title: 'Patterns',
    items: patterns,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'pattern',
    formatItem: (pattern) => pattern,
    emptyMessage: 'NO PATTERNS FOUND',
  })
}
