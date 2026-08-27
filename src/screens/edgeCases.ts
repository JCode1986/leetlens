import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapBulletItem } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'
import { G2_TEXT_LAYOUT } from './g2Layout'

function getEdgeCaseLineGroups(state: NavigationState): string[][] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return [['Problem unavailable.']]
  }

  return problem.edgeCases.map((edgeCase) =>
    wrapBulletItem(edgeCase, G2_TEXT_LAYOUT.proseCharsPerLine),
  )
}

export function createEdgeCasesTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Edge Cases',
    getEdgeCaseLineGroups(state),
  )
}

export function getEdgeCasesPageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return getDetailPageCount(problem?.title ?? 'Problem', getEdgeCaseLineGroups(state))
}
