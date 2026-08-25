import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapPrefixedText } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'

function getEdgeCaseLines(state: NavigationState): string[] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return ['Problem unavailable.']
  }

  return problem.edgeCases.flatMap((edgeCase) => wrapPrefixedText('- ', edgeCase, 31))
}

export function createEdgeCasesTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Edge Cases',
    getEdgeCaseLines(state),
  )
}

export function getEdgeCasesPageCount(state: NavigationState): number {
  return getDetailPageCount(getEdgeCaseLines(state))
}
