import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapNumberedItem } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'
import { G2_TEXT_LAYOUT } from './g2Layout'

function getApproachLineGroups(state: NavigationState): string[][] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return [['Problem unavailable.']]
  }

  return problem.approach.map((step, index) =>
    wrapNumberedItem(index + 1, step, G2_TEXT_LAYOUT.proseCharsPerLine),
  )
}

export function createApproachTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Approach',
    getApproachLineGroups(state),
  )
}

export function getApproachPageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return getDetailPageCount(problem?.title ?? 'Problem', getApproachLineGroups(state))
}
