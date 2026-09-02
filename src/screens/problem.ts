import { isFavorite } from '../services/preferencesService'
import { PROBLEM_MENU_ITEM_COUNT, PROBLEM_TABS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import { wrapHeader } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import {
  alignContentToX,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredLineGeometry,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
  getPaddedScreenTextGeometry,
} from './g2Layout'
import { getSelectedProblem } from './selectedProblem'

const PROBLEM_HEADER_Y = 10
const PROBLEM_HEADER_LINE_HEIGHT = 29
const PROBLEM_HEADER_GAP = 6
const PROBLEM_MENU_ROW_HEIGHT = 28
const PROBLEM_MENU_MIN_Y = 116
const PROBLEM_MENU_VISIBLE_ROWS = 5

export function createProblemTextObjects(state: NavigationState) {
  const problem = getSelectedProblem(state)

  if (!problem) {
    return createTextObjects([
      {
        ...getCenteredTitleGeometry('PROBLEM'),
        y: 24,
        name: 'missing-problem-title',
        content: getCenteredTitleContent('PROBLEM'),
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
  const titleContent = `#${problem.id} ${problem.title.toUpperCase()}`
  const titleLines = wrapHeader(titleContent, G2_TEXT_LAYOUT.titleCharsPerLine)
  const difficultyContent = `${problem.difficulty}  ${problem.patterns.join(', ')}`
  const complexityContent = `Time: ${problem.complexity.time}  Space: ${problem.complexity.space}`
  const difficultyLines = wrapHeader(difficultyContent, G2_TEXT_LAYOUT.maxCenteredContentCharsPerLine)
  const complexityLines = wrapHeader(complexityContent, G2_TEXT_LAYOUT.maxCenteredContentCharsPerLine)
  const metadataY = PROBLEM_HEADER_Y + titleLines.length * PROBLEM_HEADER_LINE_HEIGHT + PROBLEM_HEADER_GAP
  const complexityY = metadataY + difficultyLines.length * PROBLEM_HEADER_LINE_HEIGHT
  const menuY = Math.max(
    PROBLEM_MENU_MIN_Y,
    complexityY + complexityLines.length * PROBLEM_HEADER_LINE_HEIGHT + 14,
  )
  const menuGeometry = getCenteredTextGeometry(
    menuItems.map((item) => `> ${item.label}`),
    140,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...getPaddedScreenTextGeometry(),
      y: menuY,
      height: PROBLEM_MENU_VISIBLE_ROWS * PROBLEM_MENU_ROW_HEIGHT,
      name: `problem-menu-${selectedIndex}`,
      content: alignContentToX(menuContent, menuGeometry.x),
      textColor: 4,
    },
    ...titleLines.map((line, index) => ({
      ...getCenteredTitleGeometry(line),
      y: PROBLEM_HEADER_Y + index * PROBLEM_HEADER_LINE_HEIGHT,
      height: PROBLEM_HEADER_LINE_HEIGHT,
      name: `problem-detail-title-${index}`,
      content: getCenteredTitleContent(line),
      textColor: 4,
    })),
    ...difficultyLines.map((line, index) => ({
      ...getCenteredLineGeometry(line),
      y: metadataY + index * PROBLEM_HEADER_LINE_HEIGHT,
      height: PROBLEM_HEADER_LINE_HEIGHT,
      name: `problem-detail-difficulty-${index}`,
      content: getCenteredTitleContent(line),
      textColor: 4,
    })),
    ...complexityLines.map((line, index) => ({
      ...getCenteredLineGeometry(line),
      y: complexityY + index * PROBLEM_HEADER_LINE_HEIGHT,
      height: PROBLEM_HEADER_LINE_HEIGHT,
      name: `problem-detail-complexity-${index}`,
      content: getCenteredTitleContent(line),
      textColor: 4,
    })),
  ])
}
