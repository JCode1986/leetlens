import type { NavigationState } from '../types/navigation'
import { LANGUAGE_LABELS, SELECTABLE_PROGRAMMING_LANGUAGES } from '../utils/language'
import {
  alignContentToX,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
  getPaddedScreenTextGeometry,
} from './g2Layout'

export function createLanguageTextObjects(state: NavigationState) {
  const selectedIndex = Math.max(
    0,
    Math.min(SELECTABLE_PROGRAMMING_LANGUAGES.length - 1, state.selectedMenuIndex),
  )
  const rowGeometry = getCenteredTextGeometry(
    SELECTABLE_PROGRAMMING_LANGUAGES.map((language) =>
      `> ${LANGUAGE_LABELS[language].displayName} *`,
    ),
    140,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...getCenteredTitleGeometry('LANGUAGE'),
      y: 22,
      height: 32,
      name: 'language-title',
      content: getCenteredTitleContent('LANGUAGE'),
      textColor: 4,
    },
    ...SELECTABLE_PROGRAMMING_LANGUAGES.map((language, index) => {
      const selected = index === selectedIndex
      const active = language === state.selectedLanguage
      const label = LANGUAGE_LABELS[language].displayName

      return {
        ...getPaddedScreenTextGeometry(),
        y: 70 + index * 32,
        height: 26,
        name: `language-${language}`,
        content: alignContentToX(
          `${selected ? '>' : ' '} ${label}${active ? ' *' : ''}`,
          rowGeometry.x,
        ),
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
