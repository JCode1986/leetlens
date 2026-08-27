import categoriesData from '../data/categories.json'
import collectionsData from '../data/collections.json'
import patternsData from '../data/patterns.json'
import { DIFFICULTIES } from '../types/problem'
import type { Difficulty, Problem, ProblemId, ProblemReferenceIndex } from '../types/problem'

type JsonProblem = Omit<Problem, 'difficulty'> & {
  difficulty: string
}

const problemModules = import.meta.glob<JsonProblem>('../data/problems/*.json', {
  eager: true,
  import: 'default',
})

const jsonProblems: JsonProblem[] = Object.keys(problemModules)
  .sort()
  .map((fileName) => problemModules[fileName])

const categories: ProblemReferenceIndex = categoriesData
const patterns: ProblemReferenceIndex = patternsData
const collections: ProblemReferenceIndex = collectionsData

function parseDifficulty(value: string): Difficulty {
  const difficulty = DIFFICULTIES.find((candidate) => candidate === value)

  if (!difficulty) {
    throw new Error(`Unknown problem difficulty "${value}".`)
  }

  return difficulty
}

const problems: Problem[] = jsonProblems.map((problem) => ({
  ...problem,
  difficulty: parseDifficulty(problem.difficulty),
}))

const problemsById = new Map<ProblemId, Problem>(
  problems.map((problem) => [problem.id, problem]),
)

const problemsBySlug = new Map<string, Problem>(
  problems.map((problem) => [problem.slug, problem]),
)

function assertUniqueProblems(): void {
  if (problemsById.size !== problems.length) {
    throw new Error('Problem data contains duplicate IDs.')
  }

  if (problemsBySlug.size !== problems.length) {
    throw new Error('Problem data contains duplicate slugs.')
  }
}

function assertKnownProblemReferences(
  indexName: string,
  index: ProblemReferenceIndex,
): void {
  for (const [name, problemIds] of Object.entries(index)) {
    for (const problemId of problemIds) {
      if (!problemsById.has(problemId)) {
        throw new Error(`${indexName} "${name}" references unknown problem ID ${problemId}.`)
      }
    }
  }
}

function assertProblemTagsExistInIndexes(): void {
  for (const problem of problems) {
    for (const category of problem.categories) {
      if (!Object.hasOwn(categories, category)) {
        throw new Error(`Problem ${problem.id} references unknown category "${category}".`)
      }
    }

    for (const pattern of problem.patterns) {
      if (!Object.hasOwn(patterns, pattern)) {
        throw new Error(`Problem ${problem.id} references unknown pattern "${pattern}".`)
      }
    }
  }
}

function validateProblemData(): void {
  assertUniqueProblems()
  assertKnownProblemReferences('Category', categories)
  assertKnownProblemReferences('Pattern', patterns)
  assertKnownProblemReferences('Collection', collections)
  assertProblemTagsExistInIndexes()
}

validateProblemData()

function resolveProblemIds(problemIds: ProblemId[]): Problem[] {
  return problemIds.map((problemId) => {
    const problem = problemsById.get(problemId)

    if (!problem) {
      throw new Error(`Unknown problem ID ${problemId}.`)
    }

    return problem
  })
}

export function getAllProblems(): Problem[] {
  return [...problems].sort((a, b) => a.id - b.id)
}

export function getProblemById(id: ProblemId): Problem | undefined {
  return problemsById.get(id)
}

export function getProblemsByCategory(category: string): Problem[] {
  return resolveProblemIds(categories[category] ?? [])
}

export function getProblemsByPattern(pattern: string): Problem[] {
  return resolveProblemIds(patterns[pattern] ?? [])
}

export function getProblemsByDifficulty(difficulty: Difficulty): Problem[] {
  return getAllProblems().filter((problem) => problem.difficulty === difficulty)
}

export function getCollection(name: string): Problem[] {
  return resolveProblemIds(collections[name] ?? [])
}

export function getCategories(): string[] {
  return Object.keys(categories).sort()
}

export function getPatterns(): string[] {
  return Object.keys(patterns).sort()
}

export function getCollections(): string[] {
  return Object.keys(collections).sort()
}
