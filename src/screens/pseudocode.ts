import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { removeBlankLines, wrapHeader } from '../utils/text'
import {
  createPageEventCaptureSpec,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredContentBlockGeometry,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
} from './g2Layout'
import { getSelectedProblem } from './selectedProblem'

const PSEUDOCODE_TITLE_Y = 8
const PSEUDOCODE_LINE_HEIGHT = 29
const PSEUDOCODE_BODY_LINE_HEIGHT = 31
const PSEUDOCODE_SECTION_GAP = 2
const PSEUDOCODE_BODY_GAP = 12
const PSEUDOCODE_FOOTER_Y = 250

function getPseudocodeLinesPerPage(title: string): number {
  const titleLineCount = wrapHeader(title.toUpperCase(), G2_TEXT_LAYOUT.titleCharsPerLine).length
  const sectionY = PSEUDOCODE_TITLE_Y + titleLineCount * PSEUDOCODE_LINE_HEIGHT + PSEUDOCODE_SECTION_GAP
  const bodyY = sectionY + PSEUDOCODE_LINE_HEIGHT + PSEUDOCODE_BODY_GAP

  return Math.max(1, Math.floor((PSEUDOCODE_FOOTER_Y - bodyY - PSEUDOCODE_BODY_GAP) / PSEUDOCODE_BODY_LINE_HEIGHT))
}

function getPseudocodeLines(problem: Problem | undefined): string[] {
  const lines = problem ? problem.pseudocode : ['Problem unavailable.']

  return removeBlankLines(lines)
}

export function createPseudocodeTextObjects(state: NavigationState) {
  const problem = getSelectedProblem(state)
  const title = problem?.title ?? 'Problem'
  const lines = getPseudocodeLines(problem)
  const titleLines = wrapHeader(title.toUpperCase(), G2_TEXT_LAYOUT.titleCharsPerLine)
  const linesPerPage = getPseudocodeLinesPerPage(title)
  const pages = paginateLines(lines, linesPerPage)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const sectionY = PSEUDOCODE_TITLE_Y +
    titleLines.length * PSEUDOCODE_LINE_HEIGHT +
    PSEUDOCODE_SECTION_GAP
  const bodyY = sectionY + PSEUDOCODE_LINE_HEIGHT + PSEUDOCODE_BODY_GAP
  const bodyHeight = Math.max(
    PSEUDOCODE_BODY_LINE_HEIGHT,
    PSEUDOCODE_FOOTER_Y - bodyY - PSEUDOCODE_BODY_GAP,
  )
  const bodyContent = pageLines.length > 0 ? pageLines.join('\n') : ' '
  const pageText = `${pageIndex + 1}/${totalPages}`
  const spaciousTitlePadding = G2_TEXT_LAYOUT.screenWidth

  return createTextObjects([
    createPageEventCaptureSpec(`pseudocode-capture-${pageIndex}`),
    ...titleLines.map((line, index) => ({
      ...getCenteredTitleGeometry(line, spaciousTitlePadding),
      y: PSEUDOCODE_TITLE_Y + index * PSEUDOCODE_LINE_HEIGHT,
      height: PSEUDOCODE_LINE_HEIGHT,
      name: `pseudocode-title-${index}`,
      content: getCenteredTitleContent(line),
      textColor: 4,
    })),
    {
      ...getCenteredTitleGeometry('PSEUDOCODE', spaciousTitlePadding),
      y: sectionY,
      height: PSEUDOCODE_LINE_HEIGHT,
      name: 'pseudocode-section',
      content: 'PSEUDOCODE',
      textColor: 3,
    },
    {
      ...getCenteredContentBlockGeometry(bodyContent),
      y: bodyY,
      height: bodyHeight,
      name: `pseudocode-body-${pageIndex}`,
      content: bodyContent,
      textColor: 4,
    },
    {
      ...getCenteredTitleGeometry(pageText, spaciousTitlePadding),
      y: PSEUDOCODE_FOOTER_Y,
      height: PSEUDOCODE_LINE_HEIGHT,
      name: 'pseudocode-page',
      content: pageText,
      textColor: 3,
    },
  ])
}

export function getPseudocodePageCount(state: NavigationState): number {
  const problem = getSelectedProblem(state)

  return paginateLines(
    getPseudocodeLines(problem),
    getPseudocodeLinesPerPage(problem?.title ?? 'Problem'),
  ).length
}
