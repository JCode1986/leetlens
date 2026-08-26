import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { truncateLine, wrapText } from '../utils/text'
import { createTextObjects } from './g2Layout'

const EXACT_MENU_ITEMS = ['Open', 'Search Again'] as const

export function createVoiceMatchTextObjects(state: NavigationState) {
  const transcriptLines = wrapText(`"${state.voiceTranscript}"`, 31).slice(0, 1)

  if (state.voiceResultMode === 'none') {
    return createTextObjects([
      {
        y: 18,
        height: 30,
        name: 'voice-no-match-title',
        content: 'NO MATCH',
        textColor: 4,
      },
      {
        y: 58,
        name: 'voice-no-match-heard',
        content: 'HEARD',
        textColor: 3,
      },
      ...transcriptLines.map((line, index) => ({
        y: 88 + index * 26,
        name: `voice-no-match-transcript-${index}`,
        content: line,
        textColor: 4,
      })),
      {
        y: 128,
        name: 'voice-no-match-help-1',
        content: 'Try saying the',
        textColor: 3,
      },
      {
        y: 154,
        name: 'voice-no-match-help-2',
        content: 'problem name again.',
        textColor: 3,
      },
      {
        x: 50,
        y: 204,
        name: 'voice-no-match-retry',
        content: '> Search Again',
        textColor: 4,
      },
    ])
  }

  const problem = getProblemById(state.voiceResultProblemIds[0] ?? -1)
  const selectedIndex = Math.max(0, Math.min(EXACT_MENU_ITEMS.length - 1, state.selectedMenuIndex))

  if (!problem) {
    return createTextObjects([
      {
        y: 22,
        name: 'voice-match-missing-title',
        content: 'MATCH FOUND',
        textColor: 4,
      },
      {
        y: 74,
        name: 'voice-match-missing-message',
        content: 'Problem unavailable.',
        textColor: 3,
      },
    ])
  }

  const heardLine = truncateLine(`HEARD ${transcriptLines[0] ?? ''}`, 31)
  const menuY = 186

  return createTextObjects([
    {
      y: 12,
      height: 28,
      name: 'voice-match-title',
      content: 'MATCH FOUND',
      textColor: 4,
    },
    {
      y: 44,
      height: 22,
      name: 'voice-match-heard',
      content: heardLine,
      textColor: 3,
    },
    {
      y: 78,
      height: 26,
      name: 'voice-match-problem',
      content: truncateLine(`#${problem.id} ${problem.title.toUpperCase()}`, 31),
      textColor: 4,
    },
    {
      y: 112,
      name: 'voice-match-meta',
      content: truncateLine(`${problem.difficulty}  ${problem.patterns[0] ?? ''}`, 31),
      textColor: 3,
    },
    ...EXACT_MENU_ITEMS.map((item, index) => {
      const selected = index === selectedIndex

      return {
        x: 50,
        y: menuY + index * 30,
        name: `voice-match-${index}`,
        content: `${selected ? '>' : ' '} ${item}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
