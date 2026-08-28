import { getExistingProblemsById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapParagraph } from '../utils/text'
import { createSelectableListTextObjects } from './selectableList'
import { G2_TEXT_LAYOUT } from './g2Layout'

export function createVoiceResultsTextObjects(state: NavigationState) {
  const title = state.voiceResultMode === 'related'
    ? 'RELATED PROBLEMS'
    : 'POSSIBLE MATCHES'
  const problems = getExistingProblemsById(state.voiceResultProblemIds)

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
