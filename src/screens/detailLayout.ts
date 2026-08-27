import type { NavigationState } from '../types/navigation'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { wrapText } from '../utils/text'
import { createTextObjects, G2_TEXT_LAYOUT, MAX_TEXT_CONTAINERS } from './g2Layout'

const DETAIL_TITLE_Y = 16
const DETAIL_LINE_HEIGHT = 24
const DETAIL_SECTION_GAP = 6
const DETAIL_BODY_GAP = 12
const DETAIL_FOOTER_Y = 258

function getDetailTitleLines(title: string): string[] {
  return wrapText(title.toUpperCase(), G2_TEXT_LAYOUT.defaultCharsPerLine)
}

function getDetailLinesPerPage(title: string): number {
  const titleLines = getDetailTitleLines(title)
  const headerContainerCount = titleLines.length + 1
  const footerContainerCount = 1

  return Math.max(1, MAX_TEXT_CONTAINERS - headerContainerCount - footerContainerCount)
}

export function createDetailTextObjects(
  state: NavigationState,
  title: string,
  sectionName: string,
  lines: string[],
) {
  const titleLines = getDetailTitleLines(title)
  const linesPerPage = getDetailLinesPerPage(title)
  const pages = paginateLines(lines, linesPerPage)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)
  const sectionY = DETAIL_TITLE_Y + titleLines.length * DETAIL_LINE_HEIGHT + DETAIL_SECTION_GAP
  const bodyY = sectionY + DETAIL_LINE_HEIGHT + DETAIL_BODY_GAP

  return createTextObjects([
    ...titleLines.map((line, index) => ({
      y: DETAIL_TITLE_Y + index * DETAIL_LINE_HEIGHT,
      height: DETAIL_LINE_HEIGHT,
      name: `detail-title-${index}`,
      content: line,
      textColor: 4,
    })),
    {
      y: sectionY,
      name: 'detail-section',
      content: sectionName.toUpperCase(),
      textColor: 3,
    },
    ...pageLines.map((line, index) => ({
      y: bodyY + index * 29,
      height: 24,
      name: `detail-line-${index}`,
      content: line,
      textColor: 4,
      isEventCapture: index === 0,
    })),
    {
      y: DETAIL_FOOTER_Y,
      height: 22,
      name: 'detail-page',
      content: `${pageIndex + 1}/${totalPages}`,
      textColor: 3,
      isEventCapture: pageLines.length === 0,
    },
  ])
}

export function getDetailPageCount(title: string, lines: string[]): number {
  return paginateLines(lines, getDetailLinesPerPage(title)).length
}
