export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

export const PROGRAMMING_LANGUAGES = [
  'javascript',
  'python',
  'java',
  'cpp',
  'csharp',
  'go',
  'typescript',
] as const

export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number]

export type ProblemId = number

export interface Complexity {
  time: string
  space: string
}

export interface LanguageSolution {
  desktop: string[]
  g2: string[]
}

export type ProblemSolutions = Partial<Record<ProgrammingLanguage, LanguageSolution>>

export interface Problem {
  id: ProblemId
  slug: string
  title: string
  difficulty: Difficulty
  categories: string[]
  patterns: string[]
  aliases?: string[]
  keywords?: string[]
  summary: string
  hint: string
  approach: string[]
  complexity: Complexity
  edgeCases: string[]
  solutions: ProblemSolutions
}

export type ProblemReferenceIndex = Record<string, ProblemId[]>
