import { getProblemById } from '../services/problemService'
import { isFavorite } from '../services/preferencesService'
import { PROBLEM_MENU_ITEM_COUNT, PROBLEM_TABS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects, G2_TEXT_LAYOUT, getCenteredTextGeometry } from './g2Layout'

const PROBLEM_HEADER_Y = 14
const PROBLEM_MENU_ROW_HEIGHT = 28
const PROBLEM_MENU_Y = 110
const PROBLEM_MENU_VISIBLE_ROWS = 5

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
    ...PROBLEM_TABS,
    {
      label: favoriteLabel,
    },
  ]
  const visibleWindow = getVisibleWindow(
    menuItems,
    selectedIndex,
    PROBLEM_MENU_VISIBLE_ROWS,
  )

  const menuContent = visibleWindow.items.map((item, index) => {
    const itemIndex = visibleWindow.startIndex + index
    const selected = itemIndex === selectedIndex

    return `${selected ? '>' : ' '} ${item.label}`
  }).join('\n')
  const headerContent = [
    `#${problem.id} ${problem.title.toUpperCase()}`,
    `${problem.difficulty}  ${problem.patterns.join(', ')}`,
    `Time: ${problem.complexity.time}  Space: ${problem.complexity.space}`,
  ].join('\n')
  const menuGeometry = getCenteredTextGeometry(
    menuItems.map((item) => `> ${item.label}`),
    140,
    G2_TEXT_LAYOUT.listItemWidth,
  )
  const headerGeometry = getCenteredTextGeometry(headerContent, 180, G2_TEXT_LAYOUT.listItemWidth)

  return createTextObjects([
    {
      x: menuGeometry.x,
      y: PROBLEM_MENU_Y,
      width: menuGeometry.width,
      height: PROBLEM_MENU_VISIBLE_ROWS * PROBLEM_MENU_ROW_HEIGHT,
      name: `problem-menu-${selectedIndex}`,
      content: menuContent,
      textColor: 4,
    },
    {
      x: headerGeometry.x,
      y: PROBLEM_HEADER_Y,
      width: headerGeometry.width,
      height: 80,
      name: 'problem-detail-header',
      content: headerContent,
      textColor: 4,
    },
  ])
}
