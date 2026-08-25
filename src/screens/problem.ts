import { getProblemById } from '../services/problemService'
import { PROBLEM_TABS } from '../types/navigation'
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

  const selectedIndex = Math.max(0, Math.min(PROBLEM_TABS.length - 1, state.selectedMenuIndex))
  const patterns = truncateLine(problem.patterns.join(', '), 34)

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
      name: 'problem-difficulty',
      content: problem.difficulty,
      textColor: 3,
    },
    {
      y: 78,
      name: 'problem-patterns',
      content: `Patterns: ${patterns}`,
      textColor: 3,
    },
    {
      y: 108,
      name: 'problem-complexity',
      content: `Time: ${problem.complexity.time}  Space: ${problem.complexity.space}`,
      textColor: 3,
    },
    ...PROBLEM_TABS.map((tab, index) => {
      const selected = index === selectedIndex

      return {
        x: 50,
        y: 150 + index * 28,
        width: 340,
        height: 24,
        name: `problem-tab-${tab.screen}`,
        content: `${selected ? '>' : ' '} ${tab.label}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
