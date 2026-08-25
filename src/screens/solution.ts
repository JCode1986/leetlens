import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { LANGUAGE_LABELS } from '../utils/language'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { wrapText } from '../utils/text'
import { createTextObjects } from './g2Layout'

export const CODE_LINES_PER_PAGE = 6

function getSolutionLines(state: NavigationState): string[] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return ['Problem unavailable.']
  }

  const solution = problem.solutions[state.selectedLanguage]

  if (!solution) {
    return wrapText(
      `${LANGUAGE_LABELS[state.selectedLanguage].displayName} solution unavailable. Double Click to go back.`,
      30,
    )
  }

  return solution.g2
}

export function createSolutionTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)
  const lines = getSolutionLines(state)
  const pages = paginateLines(lines, CODE_LINES_PER_PAGE)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const languageLabel = LANGUAGE_LABELS[state.selectedLanguage].compactName

  return createTextObjects([
    {
      y: 14,
      height: 28,
      name: 'solution-title',
      content: (problem?.title ?? 'Problem').toUpperCase(),
      textColor: 4,
    },
    {
      y: 46,
      height: 24,
      name: 'solution-meta',
      content: `${languageLabel}                 ${pageIndex + 1}/${totalPages}`,
      textColor: 3,
    },
    ...pageLines.map((line, index) => ({
      x: 30,
      y: 82 + index * 31,
      width: 516,
      height: 26,
      name: `solution-line-${index}`,
      content: line,
      textColor: 4,
      isEventCapture: index === 0,
    })),
  ])
}

export function getSolutionPageCount(state: NavigationState): number {
  return paginateLines(getSolutionLines(state), CODE_LINES_PER_PAGE).length
}
