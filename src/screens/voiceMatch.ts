import { getProblemById } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { wrapHeader, wrapParagraph } from '../utils/text'
import {
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
  getNavigableTextGeometry,
} from './g2Layout'

const EXACT_MENU_ITEMS = ['Open', 'Search Again'] as const

export function createVoiceMatchTextObjects(state: NavigationState) {
  const transcriptLines = wrapParagraph(
    `"${state.voiceTranscript}"`,
    G2_TEXT_LAYOUT.proseCharsPerLine,
  ).slice(0, 1)

  if (state.voiceResultMode === 'none') {
    const helpLines = wrapParagraph(
      'Try saying the problem name again.',
      G2_TEXT_LAYOUT.proseCharsPerLine,
    ).slice(0, 2)
    const retryGeometry = getNavigableTextGeometry(
      '> Search Again',
      160,
      G2_TEXT_LAYOUT.listItemWidth,
    )

    return createTextObjects([
      {
        ...getCenteredTitleGeometry('NO MATCH'),
        y: 18,
        height: 30,
        name: 'voice-no-match-title',
        content: getCenteredTitleContent('NO MATCH'),
        textColor: 4,
      },
      {
        ...getCenteredTextGeometry('HEARD'),
        y: 58,
        name: 'voice-no-match-heard',
        content: 'HEARD',
        textColor: 3,
      },
      ...transcriptLines.map((line, index) => ({
        ...getCenteredTextGeometry(line),
        y: 88 + index * 26,
        name: `voice-no-match-transcript-${index}`,
        content: line,
        textColor: 4,
      })),
      ...helpLines.map((line, index) => ({
        ...getCenteredTextGeometry(line),
        y: 128 + index * 26,
        name: `voice-no-match-help-${index}`,
        content: line,
        textColor: 3,
      })),
      {
        x: retryGeometry.x,
        y: 204,
        width: retryGeometry.width,
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
        ...getCenteredTitleGeometry('MATCH FOUND'),
        y: 22,
        name: 'voice-match-missing-title',
        content: getCenteredTitleContent('MATCH FOUND'),
        textColor: 4,
      },
      {
        ...getCenteredTextGeometry('Problem unavailable.'),
        y: 74,
        name: 'voice-match-missing-message',
        content: 'Problem unavailable.',
        textColor: 3,
      },
    ])
  }

  const heardLine = `HEARD ${transcriptLines[0] ?? ''}`
  const problemTitleLines = wrapHeader(
    `#${problem.id} ${problem.title.toUpperCase()}`,
    G2_TEXT_LAYOUT.titleCharsPerLine,
  ).slice(0, 2)
  const metaY = 78 + problemTitleLines.length * 26 + 8
  const menuY = 186
  const menuGeometry = getNavigableTextGeometry(
    EXACT_MENU_ITEMS.map((item) => `> ${item}`),
    160,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...getCenteredTitleGeometry('MATCH FOUND'),
      y: 12,
      height: 28,
      name: 'voice-match-title',
      content: getCenteredTitleContent('MATCH FOUND'),
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry(heardLine),
      y: 44,
      height: 22,
      name: 'voice-match-heard',
      content: heardLine,
      textColor: 3,
    },
    {
      ...getCenteredTitleGeometry(problemTitleLines),
      y: 78,
      height: problemTitleLines.length * 26,
      name: 'voice-match-problem',
      content: getCenteredTitleContent(problemTitleLines),
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry(`${problem.difficulty}  ${problem.patterns[0] ?? ''}`),
      y: metaY,
      name: 'voice-match-meta',
      content: `${problem.difficulty}  ${problem.patterns[0] ?? ''}`,
      textColor: 3,
    },
    ...EXACT_MENU_ITEMS.map((item, index) => {
      const selected = index === selectedIndex

      return {
        x: menuGeometry.x,
        y: menuY + index * 30,
        width: menuGeometry.width,
        name: `voice-match-${index}`,
        content: `${selected ? '>' : ' '} ${item}`,
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
