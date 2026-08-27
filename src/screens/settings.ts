import type { NavigationState } from '../types/navigation'
import { SETTINGS_MENU_ITEMS } from '../types/navigation'
import { createTextObjects, G2_TEXT_LAYOUT, getCenteredTextGeometry } from './g2Layout'

export function createSettingsTextObjects(state: NavigationState) {
  const selectedIndex = Math.max(
    0,
    Math.min(SETTINGS_MENU_ITEMS.length - 1, state.selectedMenuIndex),
  )
  const titleGeometry = getCenteredTextGeometry('SETTINGS')
  const rowGeometry = getCenteredTextGeometry(
    SETTINGS_MENU_ITEMS.map((item) => `> ${item.label}`),
    140,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...titleGeometry,
      y: 22,
      height: 32,
      name: 'settings-title',
      content: 'SETTINGS',
      textColor: 4,
    },
    ...SETTINGS_MENU_ITEMS.map((item, index) => {
      const selected = index === selectedIndex

      return {
        x: rowGeometry.x,
        y: 82 + index * 30,
        width: rowGeometry.width,
        height: 24,
        name: `settings-${item.screen}`,
        content: `${selected ? '>' : ' '} ${item.label}`,
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
