import type { NavigationState } from '../types/navigation'
import { clampPageIndex, paginateLines } from '../utils/pagination'
import { truncateLine } from '../utils/text'
import { createTextObjects } from './g2Layout'

export const DETAIL_LINES_PER_PAGE = 5

export function createDetailTextObjects(
  state: NavigationState,
  title: string,
  sectionName: string,
  lines: string[],
) {
  const pages = paginateLines(lines, DETAIL_LINES_PER_PAGE)
  const pageIndex = clampPageIndex(state.codePageIndex, pages.length)
  const pageLines = pages[pageIndex] ?? []
  const totalPages = Math.max(1, pages.length)

  return createTextObjects([
    {
      y: 16,
      height: 30,
      name: 'detail-title',
      content: truncateLine(title.toUpperCase(), 31),
      textColor: 4,
    },
    {
      y: 50,
      name: 'detail-section',
      content: sectionName.toUpperCase(),
      textColor: 3,
    },
    ...pageLines.map((line, index) => ({
      y: 92 + index * 29,
      height: 24,
      name: `detail-line-${index}`,
      content: line,
      textColor: 4,
      isEventCapture: index === 0,
    })),
    {
      y: 258,
      height: 22,
      name: 'detail-page',
      content: `${pageIndex + 1}/${totalPages}`,
      textColor: 3,
      isEventCapture: pageLines.length === 0,
    },
  ])
}

export function getDetailPageCount(lines: string[]): number {
  return paginateLines(lines, DETAIL_LINES_PER_PAGE).length
}
