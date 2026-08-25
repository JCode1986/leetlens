import { getCategories } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects } from './g2Layout'

const MAX_VISIBLE_CATEGORIES = 7

export function createCategoriesTextObjects(state: NavigationState) {
  const categories = getCategories()
  const selectedIndex = Math.max(0, Math.min(categories.length - 1, state.selectedMenuIndex))
  const visibleWindow = getVisibleWindow(categories, selectedIndex, MAX_VISIBLE_CATEGORIES)

  return createTextObjects([
    {
      y: 22,
      height: 32,
      name: 'categories-title',
      content: 'CATEGORIES',
      textColor: 4,
      isEventCapture: categories.length === 0,
    },
    ...visibleWindow.items.map((category, index) => {
      const itemIndex = visibleWindow.startIndex + index
      const selected = itemIndex === selectedIndex

      return {
        x: 50,
        y: 68 + index * 29,
        width: 410,
        height: 24,
        name: `category-${itemIndex}`,
        content: `${selected ? '>' : ' '} ${category}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
