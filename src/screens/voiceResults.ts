import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import type { Problem } from '../types/problem'
import { truncateLine, wrapText } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects } from './g2Layout'

const MAX_VISIBLE_VOICE_RESULTS = 5

function getVoiceResultProblems(state: NavigationState): Problem[] {
  return state.voiceResultProblemIds
    .map((problemId) => getProblemById(problemId))
    .filter((problem): problem is Problem => problem !== undefined)
}

export function createVoiceResultsTextObjects(state: NavigationState) {
  const title = state.voiceResultMode === 'related'
    ? 'RELATED PROBLEMS'
    : 'POSSIBLE MATCHES'
  const transcript = wrapText(`"${state.voiceTranscript}"`, 31)[0] ?? ''
  const problems = getVoiceResultProblems(state)
  const selectedIndex = Math.max(0, Math.min(problems.length - 1, state.selectedMenuIndex))
  const visibleWindow = getVisibleWindow(problems, selectedIndex, MAX_VISIBLE_VOICE_RESULTS)

  return createTextObjects([
    {
      y: 14,
      height: 28,
      name: 'voice-results-title',
      content: title,
      textColor: 4,
    },
    {
      y: 46,
      height: 22,
      name: 'voice-results-heard',
      content: `HEARD ${truncateLine(transcript, 23)}`,
      textColor: 3,
      isEventCapture: problems.length === 0,
    },
    ...(problems.length === 0
      ? [
          {
            y: 94,
            name: 'voice-results-empty',
            content: 'NO MATCHES',
            textColor: 3,
          },
        ]
      : visibleWindow.items.map((problem, index) => {
          const itemIndex = visibleWindow.startIndex + index
          const selected = itemIndex === selectedIndex
          const label = `#${problem.id} ${problem.title}`

          return {
            x: 50,
            y: 84 + index * 31,
            width: 470,
            height: 25,
            name: `voice-result-${problem.id}`,
            content: `${selected ? '>' : ' '} ${truncateLine(label, 32)}`,
            textColor: selected ? 4 : 3,
            isEventCapture: selected,
          }
        })),
  ])
}
