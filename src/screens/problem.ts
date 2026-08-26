import { getProblemById } from '../services/problemService'
import { isFavorite } from '../services/preferencesService'
import { PROBLEM_MENU_ITEM_COUNT, PROBLEM_TABS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import { truncateLine } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects } from './g2Layout'

const PROBLEM_HEADER_Y = 14
const PROBLEM_MENU_ROW_HEIGHT = 28

export function createProblemTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return createTextObjects([
      {
        y: 24,
        name: 'missing-problem-title',
        content: 'PROBLEM',
        textColor: 4,
        isEventCapture: true,
      },
      {
        y: 72,
        name: 'missing-problem-message',
        content: 'Problem unavailable.',
        textColor: 3,
      },
    ])
  }

  const selectedIndex = Math.max(0, Math.min(PROBLEM_MENU_ITEM_COUNT - 1, state.selectedMenuIndex))
  const favoriteLabel = isFavorite(problem.id) ? 'Remove Favorite' : 'Add Favorite'
  const menuItems = [
    ...PROBLEM_TABS.map((tab) => ({
      label: tab.label,
      name: `problem-tab-${tab.screen}`,
    })),
    {
      label: favoriteLabel,
      name: 'problem-favorite-toggle',
    },
  ]
  const menuStartY = 110
  const availableMenuRows = 5
  const visibleWindow = getVisibleWindow(
    menuItems,
    selectedIndex,
    availableMenuRows,
  )

  return createTextObjects([
    {
      y: PROBLEM_HEADER_Y,
      height: 26,
      name: 'problem-title',
      content: truncateLine(`#${problem.id} ${problem.title.toUpperCase()}`, 31),
      textColor: 4,
    },
    {
      y: 44,
      height: 24,
      name: 'problem-meta',
      content: truncateLine(`${problem.difficulty}  ${problem.patterns.join(', ')}`, 31),
      textColor: 3,
    },
    {
      y: 72,
      height: 24,
      name: 'problem-complexity',
      content: truncateLine(
        `Time: ${problem.complexity.time}  Space: ${problem.complexity.space}`,
        31,
      ),
      textColor: 3,
    },
    ...visibleWindow.items.map((item, index) => {
      const itemIndex = visibleWindow.startIndex + index
      const selected = itemIndex === selectedIndex

      return {
        x: 50,
        y: menuStartY + index * PROBLEM_MENU_ROW_HEIGHT,
        width: 340,
        height: 24,
        name: item.name,
        content: `${selected ? '>' : ' '} ${item.label}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
