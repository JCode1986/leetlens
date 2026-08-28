import type { NavigationState } from '../types/navigation'
import { clampPageIndex, paginateLineGroups } from '../utils/pagination'
import { wrapHeader } from '../utils/text'
import {
  createPageEventCaptureSpec,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredLineGeometry,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
} from './g2Layout'

const DETAIL_TITLE_Y = 8
const DETAIL_LINE_HEIGHT = 29
const DETAIL_BODY_LINE_HEIGHT = 28
const DETAIL_SECTION_GAP = 2
const DETAIL_BODY_GAP = 12
const DETAIL_FOOTER_Y = 250

interface DetailTextOptions {
  centeredLeadLines?: string[]
}

function getDetailTitleLines(title: string): string[] {
  return wrapHeader(title.toUpperCase(), G2_TEXT_LAYOUT.titleCharsPerLine)
}

function getDetailLinesPerPage(title: string, leadLineCount = 0): number {
  const titleLines = getDetailTitleLines(title)
  const sectionY = DETAIL_TITLE_Y + titleLines.length * DETAIL_LINE_HEIGHT + DETAIL_SECTION_GAP
  const bodyY = sectionY
    + DETAIL_LINE_HEIGHT
    + DETAIL_BODY_GAP
    + leadLineCount * DETAIL_BODY_LINE_HEIGHT

  return Math.max(1, Math.floor((DETAIL_FOOTER_Y - bodyY - DETAIL_BODY_GAP) / DETAIL_BODY_LINE_HEIGHT))
}

export function createDetailTextObjects(
  state: NavigationState,
  title: string,
  sectionName: string,
  lineGroups: string[][],
  options: DetailTextOptions = {},
) {
  const centeredLeadLines = options.centeredLeadLines ?? []
  const titleLines = getDetailTitleLines(title)
  const linesPerPage = getDetailLinesPerPage(title, centeredLeadLines.length)
  const pages = paginateLineGroups(lineGroups, linesPerPage)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const sectionY = DETAIL_TITLE_Y + titleLines.length * DETAIL_LINE_HEIGHT + DETAIL_SECTION_GAP
  const leadY = sectionY + DETAIL_LINE_HEIGHT + DETAIL_BODY_GAP
  const bodyY = leadY + centeredLeadLines.length * DETAIL_BODY_LINE_HEIGHT
  const bodyHeight = Math.max(
    DETAIL_BODY_LINE_HEIGHT,
    DETAIL_FOOTER_Y - bodyY - DETAIL_BODY_GAP,
  )
  const bodyContent = pageLines.length > 0 ? pageLines.join('\n') : ' '
  const bodyGeometry = getCenteredLineGeometry(
    bodyContent,
    undefined,
    G2_TEXT_LAYOUT.screenWidth,
  )
  const sectionText = sectionName.toUpperCase()
  const footerText = `${pageIndex + 1}/${totalPages}`
  const footerSpec = {
    ...getCenteredTitleGeometry(footerText, G2_TEXT_LAYOUT.screenWidth),
    y: DETAIL_FOOTER_Y,
    height: DETAIL_LINE_HEIGHT,
    name: 'detail-page',
    content: footerText,
    textColor: 3,
  }

  return createTextObjects([
    createPageEventCaptureSpec(`detail-capture-${pageIndex}`),
    ...titleLines.map((line, index) => ({
      ...getCenteredTitleGeometry(line, G2_TEXT_LAYOUT.screenWidth),
      y: DETAIL_TITLE_Y + index * DETAIL_LINE_HEIGHT,
      height: DETAIL_LINE_HEIGHT,
      name: `detail-title-${index}`,
      content: getCenteredTitleContent(line),
      textColor: 4,
    })),
    ...centeredLeadLines.map((line, index) => ({
      ...getCenteredLineGeometry(line, undefined, G2_TEXT_LAYOUT.screenWidth),
      y: leadY + index * DETAIL_BODY_LINE_HEIGHT,
      height: DETAIL_BODY_LINE_HEIGHT,
      name: `detail-lead-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      ...getCenteredTitleGeometry(sectionText, G2_TEXT_LAYOUT.screenWidth),
      y: sectionY,
      name: 'detail-section',
      content: getCenteredTitleContent(sectionText),
      textColor: 3,
    },
    {
      ...bodyGeometry,
      y: bodyY,
      height: bodyHeight,
      name: `detail-body-${pageIndex}`,
      content: bodyContent,
      textColor: 4,
    },
    footerSpec,
  ])
}

export function getDetailPageCount(
  title: string,
  lineGroups: string[][],
  options: DetailTextOptions = {},
): number {
  return paginateLineGroups(
    lineGroups,
    getDetailLinesPerPage(title, options.centeredLeadLines?.length ?? 0),
  ).length
}
