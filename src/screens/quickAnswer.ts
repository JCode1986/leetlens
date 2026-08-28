import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { clampPageIndex, paginateLineGroups } from '../utils/pagination'
import { wrapBulletItem, wrapHeader } from '../utils/text'
import {
  createPageEventCaptureSpec,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredLineGeometry,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
} from './g2Layout'
import { getSelectedProblem } from './selectedProblem'

const QUICK_ANSWER_TITLE_Y = 8
const QUICK_ANSWER_LINE_HEIGHT = 29
const QUICK_ANSWER_BODY_LINE_HEIGHT = 28
const QUICK_ANSWER_SECTION_GAP = 2
const QUICK_ANSWER_PATTERN_GAP = 0
const QUICK_ANSWER_BODY_GAP = 12
const QUICK_ANSWER_COMPLEXITY_Y = 204
const QUICK_ANSWER_FOOTER_Y = 250

function getQuickAnswerBulletGroups(problem: Problem | undefined): string[][] {
  if (!problem) {
    return [['Problem unavailable.']]
  }

  return problem.quickAnswer.idea.map((idea) =>
    wrapBulletItem(idea, G2_TEXT_LAYOUT.titleCharsPerLine),
  )
}

function getQuickAnswerBodyY(titleLineCount: number, patternLineCount: number): number {
  const sectionY = QUICK_ANSWER_TITLE_Y
    + titleLineCount * QUICK_ANSWER_LINE_HEIGHT
    + QUICK_ANSWER_SECTION_GAP
  const patternY = sectionY + QUICK_ANSWER_LINE_HEIGHT + QUICK_ANSWER_PATTERN_GAP

  return patternY
    + patternLineCount * QUICK_ANSWER_LINE_HEIGHT
    + QUICK_ANSWER_BODY_GAP
}

function getQuickAnswerBodyHeight(bodyY: number): number {
  return Math.max(
    QUICK_ANSWER_BODY_LINE_HEIGHT,
    QUICK_ANSWER_COMPLEXITY_Y - bodyY,
  )
}

function getQuickAnswerLinesPerPage(problem: Problem | undefined): number {
  const titleLines = wrapHeader(
    (problem?.title ?? 'Problem').toUpperCase(),
    G2_TEXT_LAYOUT.titleCharsPerLine,
  )
  const patternLines = problem
    ? wrapHeader(`Pattern: ${problem.quickAnswer.pattern}`, G2_TEXT_LAYOUT.titleCharsPerLine)
    : []
  const bodyY = getQuickAnswerBodyY(titleLines.length, patternLines.length)

  return Math.max(1, Math.floor(getQuickAnswerBodyHeight(bodyY) / QUICK_ANSWER_BODY_LINE_HEIGHT))
}

function getQuickAnswerPages(problem: Problem | undefined): string[][] {
  return paginateLineGroups(
    getQuickAnswerBulletGroups(problem),
    getQuickAnswerLinesPerPage(problem),
  )
}

export function createQuickAnswerTextObjects(state: NavigationState) {
  const problem = getSelectedProblem(state)
  const titleLines = wrapHeader(
    (problem?.title ?? 'Problem').toUpperCase(),
    G2_TEXT_LAYOUT.titleCharsPerLine,
  )
  const sectionText = 'QUICK ANSWER'
  const patternLines = problem
    ? wrapHeader(`Pattern: ${problem.quickAnswer.pattern}`, G2_TEXT_LAYOUT.titleCharsPerLine)
    : []
  const complexityLines = problem
    ? wrapHeader(
      `Time: ${problem.quickAnswer.complexity.time}   Space: ${problem.quickAnswer.complexity.space}`,
      G2_TEXT_LAYOUT.titleCharsPerLine,
    )
    : []
  const pages = getQuickAnswerPages(problem)
  const totalPages = Math.max(1, pages.length)
  const pageIndex = clampPageIndex(state.codePageIndex, totalPages)
  const pageLines = pages[pageIndex] ?? []
  const sectionY = QUICK_ANSWER_TITLE_Y
    + titleLines.length * QUICK_ANSWER_LINE_HEIGHT
    + QUICK_ANSWER_SECTION_GAP
  const patternY = sectionY + QUICK_ANSWER_LINE_HEIGHT + QUICK_ANSWER_PATTERN_GAP
  const bodyY = getQuickAnswerBodyY(titleLines.length, patternLines.length)
  const bodyHeight = getQuickAnswerBodyHeight(bodyY)
  const footerText = `${pageIndex + 1}/${totalPages}`
  const spaciousTitlePadding = G2_TEXT_LAYOUT.screenWidth

  return createTextObjects([
    createPageEventCaptureSpec(`quick-answer-capture-${pageIndex}`),
    ...titleLines.map((line, index) => ({
      ...getCenteredTitleGeometry(line, spaciousTitlePadding),
      y: QUICK_ANSWER_TITLE_Y + index * QUICK_ANSWER_LINE_HEIGHT,
      height: QUICK_ANSWER_LINE_HEIGHT,
      name: `quick-answer-title-${index}`,
      content: getCenteredTitleContent(line),
      textColor: 4,
    })),
    {
      ...getCenteredTitleGeometry(sectionText, spaciousTitlePadding),
      y: sectionY,
      height: QUICK_ANSWER_LINE_HEIGHT,
      name: 'quick-answer-section',
      content: sectionText,
      textColor: 3,
    },
    ...patternLines.map((line, index) => ({
      ...getCenteredTitleGeometry(line, spaciousTitlePadding),
      y: patternY + index * QUICK_ANSWER_LINE_HEIGHT,
      height: QUICK_ANSWER_LINE_HEIGHT,
      name: `quick-answer-pattern-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      ...getCenteredLineGeometry(
        pageLines.length > 0 ? pageLines : [' '],
        undefined,
        spaciousTitlePadding,
      ),
      y: bodyY,
      height: bodyHeight,
      name: `quick-answer-body-${pageIndex}`,
      content: pageLines.length > 0 ? pageLines.join('\n') : ' ',
      textColor: 4,
    },
    ...complexityLines.map((line, index) => ({
      ...getCenteredTitleGeometry(line, spaciousTitlePadding),
      y: QUICK_ANSWER_COMPLEXITY_Y + index * QUICK_ANSWER_LINE_HEIGHT,
      height: QUICK_ANSWER_LINE_HEIGHT,
      name: `quick-answer-complexity-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      ...getCenteredTitleGeometry(footerText, spaciousTitlePadding),
      y: QUICK_ANSWER_FOOTER_Y,
      height: QUICK_ANSWER_LINE_HEIGHT,
      name: 'quick-answer-page',
      content: footerText,
      textColor: 3,
    },
  ])
}

export function getQuickAnswerPageCount(state: NavigationState): number {
  return Math.max(1, getQuickAnswerPages(getSelectedProblem(state)).length)
}
