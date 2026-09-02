import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { wrapNumberedItem } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'
import { G2_TEXT_LAYOUT } from './g2Layout'
import { getSelectedProblem } from './selectedProblem'

function getApproachLineGroups(problem: Problem | undefined): string[][] {
  if (!problem) {
    return [['Problem unavailable.']]
  }

  const wideLineLength = G2_TEXT_LAYOUT.contentCharsPerLine

  return problem.approach.map((step, index) =>
    wrapNumberedItem(index + 1, step, wideLineLength),
  )
}

export function createApproachTextObjects(state: NavigationState) {
  const problem = getSelectedProblem(state)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Approach',
    getApproachLineGroups(problem),
  )
}

export function getApproachPageCount(state: NavigationState): number {
  const problem = getSelectedProblem(state)

  return getDetailPageCount(problem?.title ?? 'Problem', getApproachLineGroups(problem))
}
