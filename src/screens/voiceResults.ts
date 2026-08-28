import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { wrapParagraph } from '../utils/text'
import { createSelectableListTextObjects } from './selectableList'
import { G2_TEXT_LAYOUT } from './g2Layout'

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
    subtitleLines: wrapParagraph(
      `HEARD "${state.voiceTranscript}"`,
      G2_TEXT_LAYOUT.proseCharsPerLine,
    ).slice(0, 2),
    items: problems,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'voice-result',
    formatItem: (problem) => `#${problem.id} ${problem.title}`,
    emptyMessage: 'NO MATCHES',
    maxVisibleItems: 5,
  })
}
