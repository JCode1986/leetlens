import { clampHomeMenuIndex } from '../navigation/navigationState'
import { HOME_MENU_ITEMS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import {
  createTextObjects,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getNavigableTextGeometry,
} from './g2Layout'

const HOME_TITLE_Y = 18
const HOME_MENU_Y = 50
const HOME_MENU_LINE_HEIGHT = 28

export function createHomeTextObjects(navigationState: NavigationState) {
  const selectedMenuIndex = clampHomeMenuIndex(navigationState.selectedMenuIndex)
  const menuContent = HOME_MENU_ITEMS.map((item, index) =>
    `${index === selectedMenuIndex ? '>' : ' '} ${item.label}`,
  ).join('\n')
  const menuGeometry = getNavigableTextGeometry(
    HOME_MENU_ITEMS.map((item) => `> ${item.label}`),
    148,
  )

  return createTextObjects([
    {
      ...getCenteredTitleGeometry('------ LEETLENS ------'),
      y: HOME_TITLE_Y,
      height: 30,
      name: 'home-title',
      content: getCenteredTitleContent('------ LEETLENS ------'),
      textColor: 4,
    },
    {
      x: menuGeometry.x,
      y: HOME_MENU_Y,
      width: menuGeometry.width,
      height: HOME_MENU_ITEMS.length * HOME_MENU_LINE_HEIGHT,
      name: `home-${selectedMenuIndex}`,
      content: menuContent,
      textColor: 4,
    },
  ])
}
