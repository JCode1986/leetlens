import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapPrefixedText, wrapText } from '../utils/text'
import { createDetailTextObjects, getDetailPageCount } from './detailLayout'

function getQuickAnswerLines(state: NavigationState): string[] {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  if (!problem) {
    return ['Problem unavailable.']
  }

  return [
    ...wrapPrefixedText('Pattern: ', problem.quickAnswer.pattern, 31),
    '',
    ...problem.quickAnswer.idea.flatMap((idea) => wrapPrefixedText('- ', idea, 31)),
    '',
    ...wrapText(`Time: ${problem.quickAnswer.complexity.time}`, 31),
    ...wrapText(`Space: ${problem.quickAnswer.complexity.space}`, 31),
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
    getQuickAnswerLines(state),
  )
}

export function getQuickAnswerPageCount(state: NavigationState): number {
  const problem = state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)

  return getDetailPageCount(problem?.title ?? 'Problem', getQuickAnswerLines(state))
}
