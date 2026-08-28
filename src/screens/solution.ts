import type { NavigationState } from '../types/navigation'
import { LANGUAGE_LABELS } from '../utils/language'
import type { Problem } from '../types/problem'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { removeBlankLines, wrapHeader, wrapText } from '../utils/text'
import {
  createPageEventCaptureSpec,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredLineGeometry,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
} from './g2Layout'
import { getSelectedProblem } from './selectedProblem'

const SOLUTION_TITLE_Y = 8
const SOLUTION_LINE_HEIGHT = 29
const SOLUTION_BODY_LINE_HEIGHT = 31
const SOLUTION_SECTION_GAP = 2
const SOLUTION_BODY_GAP = 10
const SOLUTION_FOOTER_Y = 250

function getCodeLinesPerPage(title: string): number {
  const titleLineCount = wrapHeader(title.toUpperCase(), G2_TEXT_LAYOUT.titleCharsPerLine).length
  const sectionY = SOLUTION_TITLE_Y + titleLineCount * SOLUTION_LINE_HEIGHT + SOLUTION_SECTION_GAP
  const bodyY = sectionY + SOLUTION_LINE_HEIGHT + SOLUTION_BODY_GAP

  return Math.max(1, Math.floor((SOLUTION_FOOTER_Y - bodyY - SOLUTION_BODY_GAP) / SOLUTION_BODY_LINE_HEIGHT))
}

function getSolutionLines(problem: Problem | undefined, state: NavigationState): string[] {
  if (!problem) {
    return ['Problem unavailable.']
  }

  const solution = problem.solutions[state.selectedLanguage]

  if (!solution) {
    return removeBlankLines(wrapText(
      `${LANGUAGE_LABELS[state.selectedLanguage].displayName} solution unavailable. Double Click to go back.`,
      30,
    ))
  }

  return removeBlankLines(solution.g2)
}

export function createSolutionTextObjects(state: NavigationState) {
  const problem = getSelectedProblem(state)
  const title = problem?.title ?? 'Problem'
  const lines = getSolutionLines(problem, state)
  const titleLines = wrapHeader(title.toUpperCase(), G2_TEXT_LAYOUT.titleCharsPerLine)
  const linesPerPage = getCodeLinesPerPage(title)
  const pages = paginateLines(lines, linesPerPage)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const languageLabel = LANGUAGE_LABELS[state.selectedLanguage].compactName
  const sectionY = SOLUTION_TITLE_Y + titleLines.length * SOLUTION_LINE_HEIGHT + SOLUTION_SECTION_GAP
  const bodyY = sectionY + SOLUTION_LINE_HEIGHT + SOLUTION_BODY_GAP
  const bodyHeight = Math.max(
    SOLUTION_BODY_LINE_HEIGHT,
    SOLUTION_FOOTER_Y - bodyY - SOLUTION_BODY_GAP,
  )
  const bodyContent = pageLines.length > 0 ? pageLines.join('\n') : ' '
  const sectionText = `${languageLabel} SOLUTION`
  const pageText = `${pageIndex + 1}/${totalPages}`
  const spaciousTitlePadding = G2_TEXT_LAYOUT.screenWidth

  return createTextObjects([
    createPageEventCaptureSpec(`solution-capture-${pageIndex}`),
    ...titleLines.map((line, index) => ({
      ...getCenteredTitleGeometry(line, spaciousTitlePadding),
      y: SOLUTION_TITLE_Y + index * SOLUTION_LINE_HEIGHT,
      height: SOLUTION_LINE_HEIGHT,
      name: `solution-title-${index}`,
      content: getCenteredTitleContent(line),
      textColor: 4,
    })),
    {
      ...getCenteredTitleGeometry(sectionText, spaciousTitlePadding),
      y: sectionY,
      height: SOLUTION_LINE_HEIGHT,
      name: 'solution-section',
      content: sectionText,
      textColor: 3,
    },
    {
      ...getCenteredLineGeometry(
        pageLines.length > 0 ? pageLines : [' '],
        undefined,
        G2_TEXT_LAYOUT.screenWidth,
      ),
      y: bodyY,
      height: bodyHeight,
      name: `solution-body-${pageIndex}`,
      content: bodyContent,
      textColor: 4,
    },
    {
      ...getCenteredTitleGeometry(pageText, spaciousTitlePadding),
      y: SOLUTION_FOOTER_Y,
      height: SOLUTION_LINE_HEIGHT,
      name: 'solution-page',
      content: pageText,
      textColor: 3,
    },
  ])
}

export function getSolutionPageCount(state: NavigationState): number {
  const problem = getSelectedProblem(state)

  return paginateLines(
    getSolutionLines(problem, state),
    getCodeLinesPerPage(problem?.title ?? 'Problem'),
  ).length
}
