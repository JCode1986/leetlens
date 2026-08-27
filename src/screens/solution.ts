import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { LANGUAGE_LABELS } from '../utils/language'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { wrapText } from '../utils/text'
import {
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTextGeometry,
  MAX_TEXT_CONTAINERS,
} from './g2Layout'

const SOLUTION_TITLE_Y = 14
const SOLUTION_LINE_HEIGHT = 26
const SOLUTION_META_GAP = 4
const SOLUTION_BODY_GAP = 10

function getCodeLinesPerPage(title: string): number {
  const titleLineCount = wrapText(title.toUpperCase(), G2_TEXT_LAYOUT.defaultCharsPerLine).length
  const metaContainerCount = 1

  return Math.max(1, MAX_TEXT_CONTAINERS - titleLineCount - metaContainerCount)
}

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
  const title = problem?.title ?? 'Problem'
  const titleLines = wrapText(title.toUpperCase(), G2_TEXT_LAYOUT.defaultCharsPerLine)
  const linesPerPage = getCodeLinesPerPage(title)
  const pages = paginateLines(lines, linesPerPage)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const languageLabel = LANGUAGE_LABELS[state.selectedLanguage].compactName
  const metaY = SOLUTION_TITLE_Y + titleLines.length * SOLUTION_LINE_HEIGHT + SOLUTION_META_GAP
  const bodyY = metaY + SOLUTION_LINE_HEIGHT + SOLUTION_BODY_GAP
  const bodyContent = pageLines.length > 0 ? pageLines.join('\n') : ' '
  const metaText = `${languageLabel}                 ${pageIndex + 1}/${totalPages}`

  return createTextObjects([
    {
      x: G2_TEXT_LAYOUT.listItemX,
      y: bodyY,
      width: G2_TEXT_LAYOUT.listItemWidth,
      height: Math.max(26, pageLines.length * 31),
      name: `solution-body-${pageIndex}`,
      content: bodyContent,
      textColor: 4,
    },
    ...titleLines.map((line, index) => ({
      ...getCenteredTextGeometry(line),
      y: SOLUTION_TITLE_Y + index * SOLUTION_LINE_HEIGHT,
      height: SOLUTION_LINE_HEIGHT,
      name: `solution-title-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      ...getCenteredTextGeometry(metaText),
      y: metaY,
      height: 24,
      name: 'solution-meta',
      content: metaText,
      textColor: 3,
    },
  ])
}

export function getSolutionPageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return paginateLines(
    getSolutionLines(state),
    getCodeLinesPerPage(problem?.title ?? 'Problem'),
  ).length
}
