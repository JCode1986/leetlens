import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { getFavoriteIds, getRecentProblemIds } from './preferencesService'
import {
  getAllProblems,
  getCollection,
  getExistingProblemsById,
  getProblemsByCategory,
  getProblemsByDifficulty,
  getProblemsByPattern,
} from './problemService'

export function getProblemListTitle(state: NavigationState): string {
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

export function getProblemListProblems(state: NavigationState): Problem[] {
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
    return getExistingProblemsById(getFavoriteIds()).sort((a, b) => a.id - b.id)
  }

  if (state.problemListSource === 'recent') {
    return getExistingProblemsById(getRecentProblemIds())
  }

  if (state.selectedCategory) {
    return getProblemsByCategory(state.selectedCategory)
  }

  return []
}
