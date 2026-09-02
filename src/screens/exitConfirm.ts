import {
  EXIT_CONFIRM_ACTIONS,
  EXIT_CONFIRM_EXIT_INDEX,
} from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import {
  createTextObjects,
  getCenteredTextGeometry,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getNavigableTextGeometry,
} from './g2Layout'

const EXIT_TITLE_Y = 36
const EXIT_MESSAGE_Y = 82
const EXIT_MENU_Y = 142
const EXIT_MENU_LINE_HEIGHT = 30

export function isExitActionSelected(state: NavigationState): boolean {
  return state.currentScreen === 'exitConfirm' &&
    state.selectedMenuIndex === EXIT_CONFIRM_EXIT_INDEX
}

export function createExitConfirmTextObjects(state: NavigationState) {
  const selectedIndex = Math.max(0, Math.min(EXIT_CONFIRM_ACTIONS.length - 1, state.selectedMenuIndex))
  const menuContent = EXIT_CONFIRM_ACTIONS.map((action, index) =>
    `${index === selectedIndex ? '>' : ' '} ${action}`,
  ).join('\n')
  const menuGeometry = getNavigableTextGeometry(
    EXIT_CONFIRM_ACTIONS.map((action) => `> ${action}`),
    140,
  )

  return createTextObjects([
    {
      ...getCenteredTitleGeometry('EXIT LEETLENS?'),
      y: EXIT_TITLE_Y,
      height: 32,
      name: 'exit-confirm-title',
      content: getCenteredTitleContent('EXIT LEETLENS?'),
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry('Select Exit App to close.'),
      y: EXIT_MESSAGE_Y,
      height: 28,
      name: 'exit-confirm-message',
      content: 'Select Exit App to close.',
      textColor: 3,
    },
    {
      x: menuGeometry.x,
      y: EXIT_MENU_Y,
      width: menuGeometry.width,
      height: EXIT_CONFIRM_ACTIONS.length * EXIT_MENU_LINE_HEIGHT,
      name: `exit-confirm-${selectedIndex}`,
      content: menuContent,
      textColor: 4,
    },
  ])
}
