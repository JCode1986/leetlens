import type { NavigationState } from '../types/navigation'
import { wrapParagraph } from '../utils/text'
import {
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
} from './g2Layout'

function createErrorLines(message: string): string[] {
  return wrapParagraph(message, G2_TEXT_LAYOUT.proseCharsPerLine).slice(0, 2)
}

export function createVoiceSearchTextObjects(state: NavigationState) {
  if (state.voiceSearchStatus === 'listening') {
    const transcriptLines = state.voiceTranscript
      ? wrapParagraph(`"${state.voiceTranscript}"`, G2_TEXT_LAYOUT.proseCharsPerLine).slice(0, 2)
      : ['Speak now.', 'Click to stop.']

    return createTextObjects([
      {
        ...getCenteredTitleGeometry('VOICE SEARCH'),
        y: 22,
        height: 32,
        name: 'voice-search-title',
        content: getCenteredTitleContent('VOICE SEARCH'),
        textColor: 4,
      },
      {
        ...getCenteredTitleGeometry('LISTENING'),
        y: 82,
        height: 28,
        name: 'voice-search-listening',
        content: getCenteredTitleContent('LISTENING'),
        textColor: 4,
      },
      {
        ...getCenteredTextGeometry(transcriptLines[0]),
        y: 122,
        name: 'voice-search-speak',
        content: transcriptLines[0],
        textColor: 3,
      },
      {
        ...getCenteredTextGeometry(transcriptLines[1] ?? ' '),
        y: 150,
        name: 'voice-search-transcript',
        content: transcriptLines[1] ?? ' ',
        textColor: 3,
      },
    ])
  }

  if (state.voiceSearchStatus === 'processing') {
    return createTextObjects([
      {
        ...getCenteredTitleGeometry('VOICE SEARCH'),
        y: 22,
        height: 32,
        name: 'voice-search-title',
        content: getCenteredTitleContent('VOICE SEARCH'),
        textColor: 4,
      },
      {
        ...getCenteredTitleGeometry('PROCESSING'),
        y: 82,
        height: 28,
        name: 'voice-search-processing',
        content: getCenteredTitleContent('PROCESSING'),
        textColor: 4,
      },
    ])
  }

  if (state.voiceSearchStatus === 'error') {
    const lines = createErrorLines(state.voiceError ?? 'Voice search unavailable.')
    const title = state.voiceError === 'Deepgram API key is not configured.'
      ? 'SETUP REQUIRED'
      : state.voiceError === 'Connection error.'
        ? 'CONNECTION ERROR'
        : state.voiceError === "I didn't hear that." || state.voiceError === 'No audio captured.'
          ? "I DIDN'T HEAR THAT"
          : state.voiceError === 'Microphone unavailable.'
            ? 'MICROPHONE ERROR'
            : 'TRANSCRIPTION ERROR'

    return createTextObjects([
      {
        ...getCenteredTitleGeometry('VOICE SEARCH'),
        y: 22,
        height: 32,
        name: 'voice-search-title',
        content: getCenteredTitleContent('VOICE SEARCH'),
        textColor: 4,
      },
      {
        ...getCenteredTitleGeometry(title),
        y: 74,
        height: 24,
        name: 'voice-search-error',
        content: getCenteredTitleContent(title),
        textColor: 4,
      },
      ...lines.map((line, index) => ({
        ...getCenteredTextGeometry(line),
        y: 112 + index * 28,
        name: `voice-search-error-line-${index}`,
        content: line,
        textColor: 3,
      })),
      {
        ...getCenteredTextGeometry('> Click to retry', 160, G2_TEXT_LAYOUT.listItemWidth),
        y: 196,
        name: 'voice-search-retry',
        content: '> Click to retry',
        textColor: 4,
      },
    ])
  }

  return createTextObjects([
    {
      ...getCenteredTitleGeometry('VOICE SEARCH'),
      y: 22,
      height: 32,
      name: 'voice-search-title',
      content: getCenteredTitleContent('VOICE SEARCH'),
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry('Click to start'),
      y: 82,
      height: 28,
      name: 'voice-search-start',
      content: 'Click to start',
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry('Say a problem name'),
      y: 126,
      name: 'voice-search-help-1',
      content: 'Say a problem name',
      textColor: 3,
    },
    {
      ...getCenteredTextGeometry('or description.'),
      y: 154,
      name: 'voice-search-help-2',
      content: 'or description.',
      textColor: 3,
    },
  ])
}
