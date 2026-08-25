import { getProblemsByCategory } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { truncateLine } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects } from './g2Layout'

const MAX_VISIBLE_PROBLEMS = 7

export function createProblemListTextObjects(state: NavigationState) {
  const category = state.selectedCategory ?? 'Category'
  const problems = state.selectedCategory ? getProblemsByCategory(state.selectedCategory) : []
  const selectedIndex = Math.max(0, Math.min(problems.length - 1, state.selectedMenuIndex))
  const visibleWindow = getVisibleWindow(problems, selectedIndex, MAX_VISIBLE_PROBLEMS)

  return createTextObjects([
    {
      y: 22,
      height: 32,
      name: 'problem-list-title',
      content: truncateLine(category.toUpperCase(), 28),
      textColor: 4,
      isEventCapture: problems.length === 0,
    },
    ...visibleWindow.items.map((problem, index) => {
      const itemIndex = visibleWindow.startIndex + index
      const selected = itemIndex === selectedIndex
      const label = `#${problem.id} ${problem.title}`

      return {
        x: 50,
        y: 68 + index * 29,
        width: 470,
        height: 24,
        name: `problem-${problem.id}`,
        content: `${selected ? '>' : ' '} ${truncateLine(label, 32)}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
