import { getCollection, getProblemsByCategory, getProblemsByPattern } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { createSelectableListTextObjects } from './selectableList'

function getProblemListTitle(state: NavigationState): string {
  if (state.problemListSource === 'pattern') {
    return state.selectedPattern ?? 'Pattern'
  }

  if (state.problemListSource === 'collection') {
    return state.selectedCollection ?? 'Collection'
  }

  return state.selectedCategory ?? 'Category'
}

function getProblemListProblems(state: NavigationState): Problem[] {
  if (state.problemListSource === 'pattern' && state.selectedPattern) {
    return getProblemsByPattern(state.selectedPattern)
  }

  if (state.problemListSource === 'collection' && state.selectedCollection) {
    return getCollection(state.selectedCollection)
  }

  if (state.selectedCategory) {
    return getProblemsByCategory(state.selectedCategory)
  }

  return []
}

export function createProblemListTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: getProblemListTitle(state),
    items: getProblemListProblems(state),
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'problem',
    formatItem: (problem) => `#${problem.id} ${problem.title}`,
    emptyMessage: 'NO PROBLEMS FOUND',
  })
}
