import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { wrapText } from '../utils/text'
import { createTextObjects, G2_TEXT_LAYOUT, MAX_TEXT_CONTAINERS } from './g2Layout'

const PSEUDOCODE_TITLE_Y = 14
const PSEUDOCODE_LINE_HEIGHT = 26
const PSEUDOCODE_META_GAP = 4
const PSEUDOCODE_BODY_GAP = 10

function getPseudocodeLinesPerPage(title: string): number {
  const titleLineCount = wrapText(title.toUpperCase(), G2_TEXT_LAYOUT.defaultCharsPerLine).length
  const metaContainerCount = 1

  return Math.max(1, MAX_TEXT_CONTAINERS - titleLineCount - metaContainerCount)
}

function getPseudocodeLines(state: NavigationState): string[] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return problem ? problem.pseudocode : ['Problem unavailable.']
}

export function createPseudocodeTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)
  const lines = getPseudocodeLines(state)
  const title = problem?.title ?? 'Problem'
  const titleLines = wrapText(title.toUpperCase(), G2_TEXT_LAYOUT.defaultCharsPerLine)
  const linesPerPage = getPseudocodeLinesPerPage(title)
  const pages = paginateLines(lines, linesPerPage)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const metaY = PSEUDOCODE_TITLE_Y +
    titleLines.length * PSEUDOCODE_LINE_HEIGHT +
    PSEUDOCODE_META_GAP
  const bodyY = metaY + PSEUDOCODE_LINE_HEIGHT + PSEUDOCODE_BODY_GAP

  return createTextObjects([
    ...titleLines.map((line, index) => ({
      y: PSEUDOCODE_TITLE_Y + index * PSEUDOCODE_LINE_HEIGHT,
      height: PSEUDOCODE_LINE_HEIGHT,
      name: `pseudocode-title-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      y: metaY,
      height: 24,
      name: 'pseudocode-meta',
      content: `PSEUDOCODE              ${pageIndex + 1}/${totalPages}`,
      textColor: 3,
    },
    ...pageLines.map((line, index) => ({
      x: 30,
      y: bodyY + index * 31,
      width: 516,
      height: 26,
      name: `pseudocode-line-${index}`,
      content: line,
      textColor: 4,
      isEventCapture: index === 0,
    })),
  ])
}

export function getPseudocodePageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return paginateLines(
    getPseudocodeLines(state),
    getPseudocodeLinesPerPage(problem?.title ?? 'Problem'),
  ).length
}
