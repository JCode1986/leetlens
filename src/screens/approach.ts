import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapPrefixedText } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'

function getApproachLines(state: NavigationState): string[] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return ['Problem unavailable.']
  }

  return problem.approach.flatMap((step, index) =>
    wrapPrefixedText(`${index + 1}. `, step, 31),
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
    getApproachLines(state),
  )
}

export function getApproachPageCount(state: NavigationState): number {
  return getDetailPageCount(getApproachLines(state))
}
