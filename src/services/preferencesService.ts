import type { SelectableProgrammingLanguage } from '../utils/language'
import { isSelectableProgrammingLanguage } from '../utils/language'
import type { ProblemId } from '../types/problem'

const DEFAULT_LANGUAGE: SelectableProgrammingLanguage = 'javascript'
const DEFAULT_LANGUAGE_STORAGE_KEY = 'leetlens.defaultLanguage'
const FAVORITES_STORAGE_KEY = 'leetlens.favorites'
const RECENT_PROBLEMS_STORAGE_KEY = 'leetlens.recentProblems'
const RECENT_PROBLEMS_LIMIT = 20

let memoryFavoriteIds: ProblemId[] = []
let memoryRecentProblemIds: ProblemId[] = []
let localStorageUnavailable = false

function getLocalStorage(): Storage | undefined {
  if (localStorageUnavailable) {
    return undefined
  }

  try {
    return window.localStorage
  } catch {
    localStorageUnavailable = true
    return undefined
  }
}

function parseStoredProblemIds(value: string | null): ProblemId[] {
  if (!value) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return []
    }

    return [...new Set(parsed.filter(
      (id): id is ProblemId => Number.isInteger(id) && id > 0,
    ))]
  } catch {
    return []
  }
}

function readProblemIds(storageKey: string, fallback: ProblemId[]): ProblemId[] {
  const storage = getLocalStorage()

  if (!storage) {
    return [...fallback]
  }

  try {
    return parseStoredProblemIds(storage.getItem(storageKey))
  } catch {
    localStorageUnavailable = true
    return [...fallback]
  }
}

function writeProblemIds(
  storageKey: string,
  problemIds: ProblemId[],
  updateFallback: (ids: ProblemId[]) => void,
): void {
  const normalizedIds = [...new Set(problemIds.filter((id) => Number.isInteger(id) && id > 0))]

  updateFallback(normalizedIds)

  const storage = getLocalStorage()

  if (!storage) {
    return
  }

  try {
    storage.setItem(storageKey, JSON.stringify(normalizedIds))
  } catch {
    localStorageUnavailable = true
    // Keep the in-memory value for this session if local storage fails.
  }
}

export function loadDefaultLanguagePreference(): SelectableProgrammingLanguage {
  const storage = getLocalStorage()

  if (!storage) {
    return DEFAULT_LANGUAGE
  }

  const storedLanguage = storage.getItem(DEFAULT_LANGUAGE_STORAGE_KEY)

  return storedLanguage && isSelectableProgrammingLanguage(storedLanguage)
    ? storedLanguage
    : DEFAULT_LANGUAGE
}

export function saveDefaultLanguagePreference(language: SelectableProgrammingLanguage): void {
  const storage = getLocalStorage()

  if (!storage) {
    return
  }

  try {
    storage.setItem(DEFAULT_LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Ignore storage failures; the in-memory selection still applies.
  }
}

export function getFavoriteIds(): ProblemId[] {
  memoryFavoriteIds = readProblemIds(FAVORITES_STORAGE_KEY, memoryFavoriteIds)

  return [...memoryFavoriteIds]
}

export function isFavorite(problemId: ProblemId): boolean {
  return getFavoriteIds().includes(problemId)
}

function addFavorite(problemId: ProblemId): ProblemId[] {
  const favoriteIds = getFavoriteIds()

  if (!favoriteIds.includes(problemId)) {
    favoriteIds.push(problemId)
  }

  const sortedFavoriteIds = favoriteIds.sort((a, b) => a - b)

  writeProblemIds(FAVORITES_STORAGE_KEY, sortedFavoriteIds, (ids) => {
    memoryFavoriteIds = ids
  })

  return getFavoriteIds()
}

function removeFavorite(problemId: ProblemId): ProblemId[] {
  const favoriteIds = getFavoriteIds().filter((id) => id !== problemId)

  writeProblemIds(FAVORITES_STORAGE_KEY, favoriteIds, (ids) => {
    memoryFavoriteIds = ids
  })

  return getFavoriteIds()
}

export function toggleFavorite(problemId: ProblemId): ProblemId[] {
  return isFavorite(problemId)
    ? removeFavorite(problemId)
    : addFavorite(problemId)
}

export function getRecentProblemIds(): ProblemId[] {
  memoryRecentProblemIds = readProblemIds(RECENT_PROBLEMS_STORAGE_KEY, memoryRecentProblemIds)

  return [...memoryRecentProblemIds]
}

export function addRecentProblem(problemId: ProblemId): ProblemId[] {
  const recentProblemIds = [
    problemId,
    ...getRecentProblemIds().filter((id) => id !== problemId),
  ].slice(0, RECENT_PROBLEMS_LIMIT)

  writeProblemIds(RECENT_PROBLEMS_STORAGE_KEY, recentProblemIds, (ids) => {
    memoryRecentProblemIds = ids
  })

  return getRecentProblemIds()
}
