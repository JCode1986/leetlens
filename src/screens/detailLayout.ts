import type { NavigationState } from '../types/navigation'
import { clampPageIndex, paginateLineGroups } from '../utils/pagination'
import { wrapHeader } from '../utils/text'
import { createTextObjects, G2_TEXT_LAYOUT, getCenteredTextGeometry } from './g2Layout'

const DETAIL_TITLE_Y = 16
const DETAIL_LINE_HEIGHT = 24
const DETAIL_BODY_LINE_HEIGHT = 29
const DETAIL_SECTION_GAP = 6
const DETAIL_BODY_GAP = 12
const DETAIL_FOOTER_Y = 258

function getDetailTitleLines(title: string): string[] {
  return wrapHeader(title.toUpperCase(), G2_TEXT_LAYOUT.defaultCharsPerLine)
}

function getDetailLinesPerPage(title: string): number {
  const titleLines = getDetailTitleLines(title)
  const sectionY = DETAIL_TITLE_Y + titleLines.length * DETAIL_LINE_HEIGHT + DETAIL_SECTION_GAP
  const bodyY = sectionY + DETAIL_LINE_HEIGHT + DETAIL_BODY_GAP

  return Math.max(1, Math.floor((DETAIL_FOOTER_Y - bodyY) / DETAIL_BODY_LINE_HEIGHT))
}

export function createDetailTextObjects(
  state: NavigationState,
  title: string,
  sectionName: string,
  lineGroups: string[][],
) {
  const titleLines = getDetailTitleLines(title)
  const linesPerPage = getDetailLinesPerPage(title)
  const pages = paginateLineGroups(lineGroups, linesPerPage)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const sectionY = DETAIL_TITLE_Y + titleLines.length * DETAIL_LINE_HEIGHT + DETAIL_SECTION_GAP
  const bodyY = sectionY + DETAIL_LINE_HEIGHT + DETAIL_BODY_GAP
  const bodyContent = pageLines.length > 0 ? pageLines.join('\n') : ' '
  const sectionText = sectionName.toUpperCase()
  const footerText = `${pageIndex + 1}/${totalPages}`
  const footerSpec = {
    ...getCenteredTextGeometry(footerText),
    y: DETAIL_FOOTER_Y,
    height: 22,
    name: 'detail-page',
    content: footerText,
    textColor: 3,
  }

  return createTextObjects([
    {
      y: bodyY,
      height: Math.max(24, pageLines.length * DETAIL_BODY_LINE_HEIGHT),
      name: `detail-body-${pageIndex}`,
      content: bodyContent,
      textColor: 4,
    },
    ...titleLines.map((line, index) => ({
      ...getCenteredTextGeometry(line),
      y: DETAIL_TITLE_Y + index * DETAIL_LINE_HEIGHT,
      height: DETAIL_LINE_HEIGHT,
      name: `detail-title-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      ...getCenteredTextGeometry(sectionText),
      y: sectionY,
      name: 'detail-section',
      content: sectionText,
      textColor: 3,
    },
    footerSpec,
  ])
}

export function getDetailPageCount(title: string, lineGroups: string[][]): number {
  return paginateLineGroups(lineGroups, getDetailLinesPerPage(title)).length
}
