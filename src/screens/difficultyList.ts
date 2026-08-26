import { DIFFICULTIES } from '../types/problem'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createDifficultyListTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'By Difficulty',
    items: [...DIFFICULTIES],
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'difficulty',
    formatItem: (difficulty) => difficulty,
  })
}
