import {
  getAllProblems,
  getCollection,
  getProblemById,
  getProblemsByCategory,
  getProblemsByDifficulty,
  getProblemsByPattern,
} from '../services/problemService'
import { getFavoriteIds, getRecentProblemIds } from '../services/preferencesService'
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

  if (state.problemListSource === 'all') {
    return 'All Problems'
  }

  if (state.problemListSource === 'difficulty') {
    return state.selectedDifficulty ?? 'Difficulty'
  }

  if (state.problemListSource === 'favorites') {
    return 'Favorites'
  }

  if (state.problemListSource === 'recent') {
    return 'Recent'
  }

  return state.selectedCategory ?? 'Category'
}

function resolveProblemIds(problemIds: number[]): Problem[] {
  return problemIds
    .map((problemId) => getProblemById(problemId))
    .filter((problem): problem is Problem => problem !== undefined)
}

function getProblemListProblems(state: NavigationState): Problem[] {
  if (state.problemListSource === 'pattern' && state.selectedPattern) {
    return getProblemsByPattern(state.selectedPattern)
  }

  if (state.problemListSource === 'collection' && state.selectedCollection) {
    return getCollection(state.selectedCollection)
  }

  if (state.problemListSource === 'all') {
    return getAllProblems()
  }

  if (state.problemListSource === 'difficulty' && state.selectedDifficulty) {
    return getProblemsByDifficulty(state.selectedDifficulty)
  }

  if (state.problemListSource === 'favorites') {
    return resolveProblemIds(getFavoriteIds()).sort((a, b) => a.id - b.id)
  }

  if (state.problemListSource === 'recent') {
    return resolveProblemIds(getRecentProblemIds())
  }

  if (state.selectedCategory) {
    return getProblemsByCategory(state.selectedCategory)
  }

  return []
}

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
