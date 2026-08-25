import type { SelectableProgrammingLanguage } from '../utils/language'
import { isSelectableProgrammingLanguage } from '../utils/language'

const DEFAULT_LANGUAGE: SelectableProgrammingLanguage = 'javascript'
const DEFAULT_LANGUAGE_STORAGE_KEY = 'leetlens.defaultLanguage'

function getLocalStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
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
