import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapBulletItem, wrapLabelValue, wrapParagraph } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'
import { G2_TEXT_LAYOUT } from './g2Layout'

function getQuickAnswerLineGroups(state: NavigationState): string[][] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return [['Problem unavailable.']]
  }

  return [
    wrapLabelValue('Pattern:', problem.quickAnswer.pattern, G2_TEXT_LAYOUT.proseCharsPerLine),
    ['Idea:'],
    ...problem.quickAnswer.idea.map((idea) =>
      wrapBulletItem(idea, G2_TEXT_LAYOUT.proseCharsPerLine),
    ),
    wrapParagraph(`Time: ${problem.quickAnswer.complexity.time}`, G2_TEXT_LAYOUT.proseCharsPerLine),
    wrapParagraph(`Space: ${problem.quickAnswer.complexity.space}`, G2_TEXT_LAYOUT.proseCharsPerLine),
  ]
}

export function createQuickAnswerTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Quick Answer',
    getQuickAnswerLineGroups(state),
  )
}

export function getQuickAnswerPageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return getDetailPageCount(problem?.title ?? 'Problem', getQuickAnswerLineGroups(state))
}
