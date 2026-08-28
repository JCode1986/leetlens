import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { wrapBulletItem } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'
import { G2_TEXT_LAYOUT } from './g2Layout'
import { getSelectedProblem } from './selectedProblem'

function getEdgeCaseLineGroups(problem: Problem | undefined): string[][] {
  if (!problem) {
    return [['Problem unavailable.']]
  }

  const wideLineLength = G2_TEXT_LAYOUT.maxCenteredContentCharsPerLine

  return problem.edgeCases.map((edgeCase) =>
    wrapBulletItem(edgeCase, wideLineLength),
  )
}

export function createEdgeCasesTextObjects(state: NavigationState) {
  const problem = getSelectedProblem(state)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Edge Cases',
    getEdgeCaseLineGroups(problem),
  )
}

export function getEdgeCasesPageCount(state: NavigationState): number {
  const problem = getSelectedProblem(state)

  return getDetailPageCount(problem?.title ?? 'Problem', getEdgeCaseLineGroups(problem))
}
