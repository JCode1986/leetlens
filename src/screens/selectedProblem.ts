import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'

export function getSelectedProblem(state: NavigationState): Problem | undefined {
  return state.selectedProblemId === undefined
    ? undefined
    : getProblemById(state.selectedProblemId)
}
