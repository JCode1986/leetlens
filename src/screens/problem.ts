import { getProblemById } from '../services/problemService'
import { isFavorite } from '../services/preferencesService'
import { PROBLEM_FAVORITE_MENU_INDEX, PROBLEM_MENU_ITEM_COUNT, PROBLEM_TABS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import { truncateLine } from '../utils/text'
import { createTextObjects } from './g2Layout'

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
        isEventCapture: true,
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
  const patterns = truncateLine(problem.patterns.join(', '), 22)
  const favoriteLabel = isFavorite(problem.id) ? 'Remove Favorite' : 'Add Favorite'

  return createTextObjects([
    {
      y: 16,
      height: 30,
      name: 'problem-title',
      content: truncateLine(`#${problem.id} ${problem.title.toUpperCase()}`, 30),
      textColor: 4,
    },
    {
      y: 48,
      name: 'problem-meta',
      content: `${problem.difficulty}  ${patterns}`,
      textColor: 3,
    },
    {
      y: 78,
      name: 'problem-complexity',
      content: `Time: ${problem.complexity.time}  Space: ${problem.complexity.space}`,
      textColor: 3,
    },
    ...[
      ...PROBLEM_TABS.map((tab) => tab.label),
      favoriteLabel,
    ].map((label, index) => {
      const selected = index === selectedIndex

      return {
        x: 50,
        y: 122 + index * 28,
        width: 340,
        height: 24,
        name: index === PROBLEM_FAVORITE_MENU_INDEX
          ? 'problem-favorite-toggle'
          : `problem-tab-${PROBLEM_TABS[index]?.screen ?? index}`,
        content: `${selected ? '>' : ' '} ${label}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
