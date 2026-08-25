import { truncateLine } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects } from './g2Layout'

const DEFAULT_MAX_VISIBLE_ITEMS = 7

interface SelectableListOptions<T> {
  title: string
  items: T[]
  selectedIndex: number
  itemNamePrefix: string
  formatItem: (item: T) => string
  emptyMessage?: string
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
  emptyMessage = 'NO ITEMS FOUND',
  maxVisibleItems = DEFAULT_MAX_VISIBLE_ITEMS,
  maxTitleLength = 28,
  maxItemLength = 32,
}: SelectableListOptions<T>) {
  const clampedIndex = Math.max(0, Math.min(items.length - 1, selectedIndex))
  const visibleWindow = getVisibleWindow(items, clampedIndex, maxVisibleItems)

  return createTextObjects([
    {
      y: 22,
      height: 32,
      name: `${itemNamePrefix}-title`,
      content: truncateLine(title.toUpperCase(), maxTitleLength),
      textColor: 4,
      isEventCapture: items.length === 0,
    },
    ...(items.length === 0
      ? [
          {
            y: 82,
            height: 24,
            name: `${itemNamePrefix}-empty`,
            content: emptyMessage,
            textColor: 3,
          },
        ]
      : visibleWindow.items.map((item, index) => {
          const itemIndex = visibleWindow.startIndex + index
          const selected = itemIndex === clampedIndex

          return {
            x: 50,
            y: 68 + index * 29,
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
