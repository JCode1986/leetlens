import {
  getAllProblems,
  getCollection,
  getPatterns,
  getProblemsByPattern,
} from './problemService'
import type { StudyChoice, StudyQuestionType, StudySource } from '../types/navigation'
import type { Problem, ProblemId } from '../types/problem'

const STUDY_CONFIG = {
  questionTypes: ['pattern', 'time'] as const,
  choiceCount: 4,
  recentLimit: 8,
  blind75CollectionName: 'Blind 75',
} as const

const COMMON_COMPLEXITIES = [
  'O(1)',
  'O(log n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
  'O(m × n)',
  'O(n × m)',
  'O(2^n)',
]

export interface StudyQuestion {
  problem: Problem
  questionType: StudyQuestionType
  choices: StudyChoice[]
}

interface CreateStudyQuestionOptions {
  source: StudySource
  pattern?: string
  recentProblemIds: ProblemId[]
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const value = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = value
  }

  return shuffled
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter((item) => item.trim().length > 0))]
}

function chooseRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined
  }

  return items[Math.floor(Math.random() * items.length)]
}

function getCandidateProblems(source: StudySource, pattern?: string): Problem[] {
  if (source === 'pattern' && pattern) {
    return getProblemsByPattern(pattern)
  }

  if (source === 'blind75') {
    return getCollection(STUDY_CONFIG.blind75CollectionName)
  }

  return getAllProblems()
}

function chooseProblem(candidates: Problem[], recentProblemIds: ProblemId[]): Problem | undefined {
  if (candidates.length <= 1) {
    return candidates[0]
  }

  const recent = new Set(recentProblemIds)
  const freshCandidates = candidates.filter((problem) => !recent.has(problem.id))

  return chooseRandom(freshCandidates.length > 0 ? freshCandidates : candidates)
}

function getPrimaryPattern(problem: Problem): string {
  return problem.patterns[0] ?? problem.quickAnswer.pattern
}

function getPatternDistractors(problem: Problem, correctPattern: string): string[] {
  const categorySet = new Set(problem.categories)
  const sameCategoryPatterns = getAllProblems()
    .filter((candidate) =>
      candidate.id !== problem.id &&
      candidate.categories.some((category) => categorySet.has(category)),
    )
    .flatMap((candidate) => candidate.patterns)
  const allPatterns = getPatterns()

  return unique([
    ...sameCategoryPatterns,
    ...problem.patterns,
    ...allPatterns,
  ]).filter((pattern) => pattern !== correctPattern)
}

function buildChoices(correctAnswer: string, distractors: string[]): StudyChoice[] {
  const wrongChoices = shuffle(unique(distractors).filter((choice) => choice !== correctAnswer))
    .slice(0, STUDY_CONFIG.choiceCount - 1)

  return shuffle([
    { label: correctAnswer, isCorrect: true },
    ...wrongChoices.map((label) => ({ label, isCorrect: false })),
  ])
}

function createPatternQuestion(problem: Problem): StudyQuestion {
  const correctPattern = getPrimaryPattern(problem)

  return {
    problem,
    questionType: 'pattern',
    choices: buildChoices(correctPattern, getPatternDistractors(problem, correctPattern)),
  }
}

function createTimeQuestion(problem: Problem): StudyQuestion {
  const correctComplexity = problem.complexity.time

  return {
    problem,
    questionType: 'time',
    choices: buildChoices(correctComplexity, COMMON_COMPLEXITIES),
  }
}

export function createStudyQuestion({
  source,
  pattern,
  recentProblemIds,
}: CreateStudyQuestionOptions): StudyQuestion | undefined {
  const problem = chooseProblem(getCandidateProblems(source, pattern), recentProblemIds)

  if (!problem) {
    return undefined
  }

  const questionType = chooseRandom([...STUDY_CONFIG.questionTypes]) ?? 'pattern'

  return questionType === 'time'
    ? createTimeQuestion(problem)
    : createPatternQuestion(problem)
}

export function pushStudyRecentProblemId(
  recentProblemIds: ProblemId[],
  problemId: ProblemId,
): ProblemId[] {
  return [
    problemId,
    ...recentProblemIds.filter((recentProblemId) => recentProblemId !== problemId),
  ].slice(0, STUDY_CONFIG.recentLimit)
}
