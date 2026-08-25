import type { NavigationState } from '../types/navigation'
import { wrapText } from '../utils/text'
import { createTextObjects } from './g2Layout'

function createErrorLines(message: string): string[] {
  return wrapText(message, 31).slice(0, 2)
}

export function createVoiceSearchTextObjects(state: NavigationState) {
  if (state.voiceSearchStatus === 'listening') {
    const transcriptLines = state.voiceTranscript
      ? wrapText(`"${state.voiceTranscript}"`, 31).slice(0, 2)
      : ['Speak now.', 'Click to stop.']

    return createTextObjects([
      {
        y: 22,
        height: 32,
        name: 'voice-search-title',
        content: 'VOICE SEARCH',
        textColor: 4,
      },
      {
        y: 82,
        height: 28,
        name: 'voice-search-listening',
        content: 'LISTENING...',
        textColor: 4,
      },
      {
        y: 122,
        name: 'voice-search-speak',
        content: transcriptLines[0],
        textColor: 3,
      },
      {
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
        y: 22,
        height: 32,
        name: 'voice-search-title',
        content: 'VOICE SEARCH',
        textColor: 4,
      },
      {
        y: 82,
        height: 28,
        name: 'voice-search-processing',
        content: 'PROCESSING...',
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
        y: 22,
        height: 32,
        name: 'voice-search-title',
        content: 'VOICE SEARCH',
        textColor: 4,
      },
      {
        y: 74,
        height: 24,
        name: 'voice-search-error',
        content: title,
        textColor: 4,
      },
      ...lines.map((line, index) => ({
        y: 112 + index * 28,
        name: `voice-search-error-line-${index}`,
        content: line,
        textColor: 3,
      })),
      {
        y: 196,
        name: 'voice-search-retry',
        content: '> Click to retry',
        textColor: 4,
      },
    ])
  }

  return createTextObjects([
    {
      y: 22,
      height: 32,
      name: 'voice-search-title',
      content: 'VOICE SEARCH',
      textColor: 4,
    },
    {
      y: 82,
      height: 28,
      name: 'voice-search-start',
      content: 'Click to start',
      textColor: 4,
    },
    {
      y: 126,
      name: 'voice-search-help-1',
      content: 'Say a problem name',
      textColor: 3,
    },
    {
      y: 154,
      name: 'voice-search-help-2',
      content: 'or description.',
      textColor: 3,
    },
  ])
}
