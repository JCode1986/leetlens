import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { wrapText } from '../utils/text'
import { createSelectableListTextObjects } from './selectableList'

function getVoiceResultProblems(state: NavigationState): Problem[] {
  return state.voiceResultProblemIds
    .map((problemId) => getProblemById(problemId))
    .filter((problem): problem is Problem => problem !== undefined)
}

export function createVoiceResultsTextObjects(state: NavigationState) {
  const title = state.voiceResultMode === 'related'
    ? 'RELATED PROBLEMS'
    : 'POSSIBLE MATCHES'
  const problems = getVoiceResultProblems(state)

  return createSelectableListTextObjects({
    title,
    subtitleLines: wrapText(`HEARD "${state.voiceTranscript}"`, 31).slice(0, 2),
    items: problems,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'voice-result',
    formatItem: (problem) => `#${problem.id} ${problem.title}`,
    emptyMessage: 'NO MATCHES',
    maxVisibleItems: 5,
  })
}
