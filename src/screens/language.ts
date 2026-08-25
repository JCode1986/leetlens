import type { NavigationState } from '../types/navigation'
import { LANGUAGE_LABELS, SELECTABLE_PROGRAMMING_LANGUAGES } from '../utils/language'
import { createTextObjects } from './g2Layout'

export function createLanguageTextObjects(state: NavigationState) {
  const selectedIndex = Math.max(
    0,
    Math.min(SELECTABLE_PROGRAMMING_LANGUAGES.length - 1, state.selectedMenuIndex),
  )

  return createTextObjects([
    {
      y: 22,
      height: 32,
      name: 'language-title',
      content: 'LANGUAGE',
      textColor: 4,
    },
    ...SELECTABLE_PROGRAMMING_LANGUAGES.map((language, index) => {
      const selected = index === selectedIndex
      const active = language === state.selectedLanguage
      const label = LANGUAGE_LABELS[language].displayName

      return {
        x: 50,
        y: 70 + index * 32,
        width: 410,
        height: 26,
        name: `language-${language}`,
        content: `${selected ? '>' : ' '} ${label}${active ? ' *' : ''}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
