import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapText } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'

function getHintLines(state: NavigationState): string[] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return problem ? wrapText(problem.hint, 31) : ['Problem unavailable.']
}

export function createHintTextObjects(state: NavigationState) {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return createDetailTextObjects(
    state,
    problem?.title ?? 'Problem',
    'Hint',
    getHintLines(state),
  )
}

export function getHintPageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return getDetailPageCount(problem?.title ?? 'Problem', getHintLines(state))
}
