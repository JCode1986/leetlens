import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { wrapParagraph } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'
import { G2_TEXT_LAYOUT } from './g2Layout'
import { getSelectedProblem } from './selectedProblem'

function getHintLineGroups(problem: Problem | undefined): string[][] {
  return problem
    ? [wrapParagraph(problem.hint, G2_TEXT_LAYOUT.maxCenteredContentCharsPerLine)]
    : [['Problem unavailable.']]
}

export function createHintTextObjects(state: NavigationState) {
  const problem = getSelectedProblem(state)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Hint',
    getHintLineGroups(problem),
  )
}

export function getHintPageCount(state: NavigationState): number {
  const problem = getSelectedProblem(state)

  return getDetailPageCount(problem?.title ?? 'Problem', getHintLineGroups(problem))
}
