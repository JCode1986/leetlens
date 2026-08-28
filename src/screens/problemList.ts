import { getProblemListProblems, getProblemListTitle } from '../services/problemListService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createProblemListTextObjects(state: NavigationState) {
  const emptyLines = state.problemListSource === 'favorites'
    ? ['No favorites yet.', 'Open a problem and', 'add it to Favorites.']
    : state.problemListSource === 'recent'
      ? ['No recently viewed', 'problems yet.', 'Browse or use Find', 'to open a problem.']
      : undefined

  return createSelectableListTextObjects({
    title: getProblemListTitle(state),
    items: getProblemListProblems(state),
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'problem',
    formatItem: (problem) => `#${problem.id} ${problem.title}`,
    emptyMessage: 'NO PROBLEMS FOUND',
    emptyLines,
  })
}
