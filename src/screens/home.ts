import { clampHomeMenuIndex } from '../navigation/navigationState'
import { HOME_MENU_ITEMS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import {
  alignContentToX,
  createTextObjects,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getPaddedScreenTextGeometry,
} from './g2Layout'

const HOME_TITLE_Y = 18
const HOME_MENU_X = 214
const HOME_MENU_Y = 50
const HOME_MENU_LINE_HEIGHT = 28

export function createHomeTextObjects(navigationState: NavigationState) {
  const selectedMenuIndex = clampHomeMenuIndex(navigationState.selectedMenuIndex)
  const menuContent = HOME_MENU_ITEMS.map((item, index) =>
    `${index === selectedMenuIndex ? '>' : ' '} ${item.label}`,
  ).join('\n')

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
      ...getPaddedScreenTextGeometry(),
      y: HOME_MENU_Y,
      height: HOME_MENU_ITEMS.length * HOME_MENU_LINE_HEIGHT,
      name: `home-${selectedMenuIndex}`,
      content: alignContentToX(menuContent, HOME_MENU_X),
      textColor: 4,
    },
  ])
}
