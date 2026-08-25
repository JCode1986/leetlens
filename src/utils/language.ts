import type { ProgrammingLanguage } from '../types/problem'

export const SELECTABLE_PROGRAMMING_LANGUAGES = [
  'javascript',
  'python',
  'java',
  'cpp',
] as const satisfies readonly ProgrammingLanguage[]

export type SelectableProgrammingLanguage = (typeof SELECTABLE_PROGRAMMING_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<
  ProgrammingLanguage,
  {
    displayName: string
    compactName: string
  }
> = {
  javascript: {
    displayName: 'JavaScript',
    compactName: 'JS',
  },
  python: {
    displayName: 'Python',
    compactName: 'PY',
  },
  java: {
    displayName: 'Java',
    compactName: 'JAVA',
  },
  cpp: {
    displayName: 'C++',
    compactName: 'CPP',
  },
  csharp: {
    displayName: 'C#',
    compactName: 'C#',
  },
  go: {
    displayName: 'Go',
    compactName: 'GO',
  },
  typescript: {
    displayName: 'TypeScript',
    compactName: 'TS',
  },
}

export function isSelectableProgrammingLanguage(
  value: string,
): value is SelectableProgrammingLanguage {
  return SELECTABLE_PROGRAMMING_LANGUAGES.some((language) => language === value)
}

export function getSelectableLanguageIndex(language: SelectableProgrammingLanguage): number {
  return Math.max(0, SELECTABLE_PROGRAMMING_LANGUAGES.indexOf(language))
}
