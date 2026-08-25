import { DeepgramTranscriptionService } from './transcription/deepgramTranscriptionService'
import type {
  StreamingTranscriptionService,
  TranscriptUpdate,
  TranscriptUpdateHandler,
  TranscriptionErrorHandler,
  TranscriptionResult,
  TranscriptionStartResult,
} from './transcription/types'

export type {
  StreamingTranscriptionService,
  TranscriptUpdate,
  TranscriptUpdateHandler,
  TranscriptionErrorHandler,
  TranscriptionResult,
  TranscriptionStartResult,
}

function getDeepgramApiKey(): string | undefined {
  return import.meta.env.VITE_DEEPGRAM_API_KEY?.trim() || undefined
}

export function createStreamingTranscriptionService(): StreamingTranscriptionService {
  // Development prototype only: do not ship a permanent Deepgram key in a public client.
  // Production should use a backend token broker or short-lived STT credentials.
  return new DeepgramTranscriptionService(getDeepgramApiKey())
}
