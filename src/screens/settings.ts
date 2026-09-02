import type { NavigationState } from '../types/navigation'
import { SETTINGS_MENU_ITEMS } from '../types/navigation'
import {
  alignContentToX,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
  getPaddedScreenTextGeometry,
} from './g2Layout'

export function createSettingsTextObjects(state: NavigationState) {
  const selectedIndex = Math.max(
    0,
    Math.min(SETTINGS_MENU_ITEMS.length - 1, state.selectedMenuIndex),
  )
  const rowGeometry = getCenteredTextGeometry(
    SETTINGS_MENU_ITEMS.map((item) => `> ${item.label}`),
    140,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...getCenteredTitleGeometry('SETTINGS'),
      y: 22,
      height: 32,
      name: 'settings-title',
      content: getCenteredTitleContent('SETTINGS'),
      textColor: 4,
    },
    ...SETTINGS_MENU_ITEMS.map((item, index) => {
      const selected = index === selectedIndex

      return {
        ...getPaddedScreenTextGeometry(),
        y: 82 + index * 30,
        height: 24,
        name: `settings-${item.screen}`,
        content: alignContentToX(`${selected ? '>' : ' '} ${item.label}`, rowGeometry.x),
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
