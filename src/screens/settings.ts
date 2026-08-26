import type { NavigationState } from '../types/navigation'
import { SETTINGS_MENU_ITEMS } from '../types/navigation'
import { createTextObjects } from './g2Layout'

export function createSettingsTextObjects(state: NavigationState) {
  const selectedIndex = Math.max(
    0,
    Math.min(SETTINGS_MENU_ITEMS.length - 1, state.selectedMenuIndex),
  )

  return createTextObjects([
    {
      y: 22,
      height: 32,
      name: 'settings-title',
      content: 'SETTINGS',
      textColor: 4,
    },
    ...SETTINGS_MENU_ITEMS.map((item, index) => {
      const selected = index === selectedIndex

      return {
        x: 50,
        y: 82 + index * 30,
        width: 410,
        height: 24,
        name: `settings-${item.screen}`,
        content: `${selected ? '>' : ' '} ${item.label}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
