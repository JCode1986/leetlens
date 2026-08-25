import type { ProgrammingLanguage } from '../types/problem'

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
