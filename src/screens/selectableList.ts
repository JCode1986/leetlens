import { truncateLine } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects } from './g2Layout'

const DEFAULT_MAX_VISIBLE_ITEMS = 7
const DEFAULT_MAX_TITLE_LENGTH = 31
const DEFAULT_MAX_ITEM_LENGTH = 31
const TITLE_Y = 22
const SUBTITLE_Y = 50
const ROW_START_Y = 72
const ROW_HEIGHT = 30

interface SelectableListOptions<T> {
  title: string
  items: T[]
  selectedIndex: number
  itemNamePrefix: string
  formatItem: (item: T) => string
  subtitleLines?: string[]
  emptyMessage?: string
  emptyLines?: string[]
  maxVisibleItems?: number
  maxTitleLength?: number
  maxItemLength?: number
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
  maxTitleLength = DEFAULT_MAX_TITLE_LENGTH,
  maxItemLength = DEFAULT_MAX_ITEM_LENGTH,
}: SelectableListOptions<T>) {
  const clampedIndex = Math.max(0, Math.min(items.length - 1, selectedIndex))
  const subtitleSpecs = subtitleLines.slice(0, 2).map((line, index) => ({
    y: SUBTITLE_Y + index * 24,
    height: 22,
    name: `${itemNamePrefix}-subtitle-${index}`,
    content: truncateLine(line, maxTitleLength),
    textColor: 3,
  }))
  const rowStartY = ROW_START_Y + subtitleSpecs.length * 24
  const maxRowsForContainers = Math.max(1, 8 - 1 - subtitleSpecs.length)
  const visibleWindow = getVisibleWindow(
    items,
    clampedIndex,
    Math.min(maxVisibleItems, maxRowsForContainers),
  )
  const emptyContent = emptyLines ?? [emptyMessage]

  return createTextObjects([
    {
      y: TITLE_Y,
      height: 32,
      name: `${itemNamePrefix}-title`,
      content: truncateLine(title.toUpperCase(), maxTitleLength),
      textColor: 4,
      isEventCapture: items.length === 0,
    },
    ...subtitleSpecs,
    ...(items.length === 0
      ? emptyContent.map((line, index) => ({
          y: rowStartY + index * 28,
          height: 24,
          name: `${itemNamePrefix}-empty-${index}`,
          content: truncateLine(line, maxItemLength),
          textColor: 3,
        }))
      : visibleWindow.items.map((item, index) => {
          const itemIndex = visibleWindow.startIndex + index
          const selected = itemIndex === clampedIndex

          return {
            x: 50,
            y: rowStartY + index * ROW_HEIGHT,
            width: 470,
            height: 24,
            name: `${itemNamePrefix}-${itemIndex}`,
            content: `${selected ? '>' : ' '} ${truncateLine(formatItem(item), maxItemLength)}`,
            textColor: selected ? 4 : 3,
            isEventCapture: selected,
          }
        })),
  ])
}
