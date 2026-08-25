export type TranscriptSource = 'deepgram'

export interface TranscriptUpdate {
  transcript: string
  isFinal: boolean
  source: TranscriptSource
}

export type TranscriptionStartResult =
  | { status: 'success' }
  | { status: 'setupRequired'; message: string }
  | { status: 'unsupported'; message: string }
  | { status: 'error'; message: string }

export type TranscriptionResult =
  | { status: 'success'; transcript: string; source: TranscriptSource }
  | { status: 'empty'; message: string }
  | { status: 'setupRequired'; message: string }
  | { status: 'connectionError'; message: string }
  | { status: 'transcriptionError'; message: string }
  | { status: 'unsupported'; message: string }

export type TranscriptUpdateHandler = (update: TranscriptUpdate) => void
export type TranscriptionErrorHandler = (message: string) => void

export interface StreamingTranscriptionService {
  start(): Promise<TranscriptionStartResult>
  sendPcm(chunk: Uint8Array): void
  stop(): Promise<TranscriptionResult>
  close(): void
  getTranscript(): string
  onTranscript(handler: TranscriptUpdateHandler): () => void
  onError(handler: TranscriptionErrorHandler): () => void
}
