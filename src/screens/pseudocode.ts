import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { wrapText } from '../utils/text'
import {
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTextGeometry,
  MAX_TEXT_CONTAINERS,
} from './g2Layout'

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
  const bodyContent = pageLines.length > 0 ? pageLines.join('\n') : ' '
  const metaText = `PSEUDOCODE              ${pageIndex + 1}/${totalPages}`

  return createTextObjects([
    {
      x: G2_TEXT_LAYOUT.listItemX,
      y: bodyY,
      width: G2_TEXT_LAYOUT.listItemWidth,
      height: Math.max(26, pageLines.length * 31),
      name: `pseudocode-body-${pageIndex}`,
      content: bodyContent,
      textColor: 4,
    },
    ...titleLines.map((line, index) => ({
      ...getCenteredTextGeometry(line),
      y: PSEUDOCODE_TITLE_Y + index * PSEUDOCODE_LINE_HEIGHT,
      height: PSEUDOCODE_LINE_HEIGHT,
      name: `pseudocode-title-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      ...getCenteredTextGeometry(metaText),
      y: metaY,
      height: 24,
      name: 'pseudocode-meta',
      content: metaText,
      textColor: 3,
    },
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
