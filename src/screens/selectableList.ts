import { getVisibleWindow } from '../utils/visibleWindow'
import {
  createTextObjects,
  G2_TEXT_LAYOUT,
  MAX_VISIBLE_TEXT_CONTAINERS,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
  getNavigableTextGeometry,
} from './g2Layout'

const DEFAULT_MAX_VISIBLE_ITEMS = 6
const TITLE_Y = 22
const SUBTITLE_Y = 50
const ROW_START_Y = 72
const ROW_HEIGHT = 30

interface SelectableListOptions<T> {
  title: string
  items: readonly T[]
  selectedIndex: number
  itemNamePrefix: string
  formatItem: (item: T) => string
  subtitleLines?: string[]
  emptyMessage?: string
  emptyLines?: string[]
  maxVisibleItems?: number
}

export function createSelectableListTextObjects<T>({
  title,
  items,
  selectedIndex,
  itemNamePrefix,
  formatItem,
  subtitleLines = [],
  emptyMessage = 'NO ITEMS FOUND',
  emptyLines,
  maxVisibleItems = DEFAULT_MAX_VISIBLE_ITEMS,
}: SelectableListOptions<T>) {
  const clampedIndex = Math.max(0, Math.min(items.length - 1, selectedIndex))
  const titleText = title.toUpperCase()
  const subtitleSpecs = subtitleLines.slice(0, 2).map((line, index) => ({
    ...getCenteredTextGeometry(line),
    y: SUBTITLE_Y + index * 24,
    height: 22,
    name: `${itemNamePrefix}-subtitle-${index}`,
    content: line,
    textColor: 3,
  }))
  const rowStartY = ROW_START_Y + subtitleSpecs.length * 24
  const maxRowsForContainers = Math.max(1, MAX_VISIBLE_TEXT_CONTAINERS - 1 - subtitleSpecs.length)
  const visibleWindow = getVisibleWindow(
    items,
    clampedIndex,
    Math.min(maxVisibleItems, maxRowsForContainers),
  )
  const emptyContent = emptyLines ?? [emptyMessage]
  const rowGeometry = getNavigableTextGeometry(
    items.map((item) => `> ${formatItem(item)}`),
    140,
    G2_TEXT_LAYOUT.listItemWidth,
  )
  const emptyGeometry = getCenteredTextGeometry(emptyContent, 140, G2_TEXT_LAYOUT.listItemWidth)

  return createTextObjects([
    {
      ...getCenteredTitleGeometry(titleText),
      y: TITLE_Y,
      height: 32,
      name: `${itemNamePrefix}-title`,
      content: getCenteredTitleContent(titleText),
      textColor: 4,
    },
    ...subtitleSpecs,
    ...(items.length === 0
      ? emptyContent.map((line, index) => ({
          ...emptyGeometry,
          y: rowStartY + index * 28,
          height: 24,
          name: `${itemNamePrefix}-empty-${index}`,
          content: line,
          textColor: 3,
        }))
      : visibleWindow.items.map((item, index) => {
          const itemIndex = visibleWindow.startIndex + index
          const selected = itemIndex === clampedIndex

          return {
            x: rowGeometry.x,
            y: rowStartY + index * ROW_HEIGHT,
            width: rowGeometry.width,
            height: 24,
            name: `${itemNamePrefix}-${itemIndex}`,
            content: `${selected ? '>' : ' '} ${formatItem(item)}`,
            textColor: selected ? 4 : 3,
          }
        })),
  ])
}
