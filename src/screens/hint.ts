import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapParagraph } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'
import { G2_TEXT_LAYOUT } from './g2Layout'

function getHintLineGroups(state: NavigationState): string[][] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return problem
    ? [wrapParagraph(problem.hint, G2_TEXT_LAYOUT.proseCharsPerLine)]
    : [['Problem unavailable.']]
}

export function createHintTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Hint',
    getHintLineGroups(state),
  )
}

export function getHintPageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return getDetailPageCount(problem?.title ?? 'Problem', getHintLineGroups(state))
}
