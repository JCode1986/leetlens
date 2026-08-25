import type {
  StreamingTranscriptionService,
  TranscriptUpdate,
  TranscriptUpdateHandler,
  TranscriptionErrorHandler,
  TranscriptionResult,
  TranscriptionStartResult,
} from './types'

const DEEPGRAM_LISTEN_ENDPOINT = 'wss://api.deepgram.com/v1/listen'
const DEEPGRAM_OPEN_TIMEOUT_MS = 5000
const DEEPGRAM_FINALIZE_WAIT_MS = 1200

interface DeepgramAlternative {
  transcript?: unknown
}

interface DeepgramChannel {
  alternatives?: unknown
}

interface DeepgramMessage {
  type?: unknown
  channel?: unknown
  is_final?: unknown
  speech_final?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseDeepgramMessage(value: string): DeepgramMessage | undefined {
  try {
    const parsed: unknown = JSON.parse(value)

    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function getDeepgramTranscript(message: DeepgramMessage): string {
  if (!isRecord(message.channel)) {
    return ''
  }

  const channel = message.channel as DeepgramChannel

  if (!Array.isArray(channel.alternatives)) {
    return ''
  }

  const firstAlternative = channel.alternatives[0] as DeepgramAlternative | undefined

  return typeof firstAlternative?.transcript === 'string'
    ? firstAlternative.transcript.trim()
    : ''
}

function joinTranscriptParts(parts: string[], interimTranscript = ''): string {
  return [...parts, interimTranscript]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}

function createDeepgramUrl(): string {
  const url = new URL(DEEPGRAM_LISTEN_ENDPOINT)

  url.searchParams.set('model', 'nova-3')
  url.searchParams.set('language', 'en-US')
  url.searchParams.set('encoding', 'linear16')
  url.searchParams.set('sample_rate', '16000')
  url.searchParams.set('channels', '1')
  url.searchParams.set('interim_results', 'true')
  url.searchParams.set('endpointing', '750')
  url.searchParams.set('vad_events', 'true')
  url.searchParams.set('smart_format', 'true')

  return url.toString()
}

export class DeepgramTranscriptionService implements StreamingTranscriptionService {
  private socket: WebSocket | undefined
  private finalTranscriptParts: string[] = []
  private latestInterimTranscript = ''
  private manualClose = false
  private readonly apiKey: string | undefined
  private readonly transcriptHandlers = new Set<TranscriptUpdateHandler>()
  private readonly errorHandlers = new Set<TranscriptionErrorHandler>()

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey
  }

  async start(): Promise<TranscriptionStartResult> {
    if (!this.apiKey) {
      return {
        status: 'setupRequired',
        message: 'Deepgram API key is not configured.',
      }
    }

    if (typeof WebSocket === 'undefined') {
      return {
        status: 'unsupported',
        message: 'WebSocket transcription is unavailable.',
      }
    }

    this.finalTranscriptParts = []
    this.latestInterimTranscript = ''
    this.manualClose = false

    return new Promise((resolve) => {
      let settled = false
      const socket = new WebSocket(createDeepgramUrl(), ['token', this.apiKey])
      const timeoutId = window.setTimeout(() => {
        if (settled) {
          return
        }

        settled = true
        this.manualClose = true
        socket.close()
        resolve({
          status: 'error',
          message: 'Connection error.',
        })
      }, DEEPGRAM_OPEN_TIMEOUT_MS)

      this.socket = socket

      socket.binaryType = 'arraybuffer'

      socket.onopen = () => {
        if (settled) {
          return
        }

        settled = true
        window.clearTimeout(timeoutId)
        resolve({ status: 'success' })
      }

      socket.onerror = () => {
        this.notifyError('Connection error.')

        if (settled) {
          return
        }

        settled = true
        window.clearTimeout(timeoutId)
        resolve({
          status: 'error',
          message: 'Connection error.',
        })
      }

      socket.onclose = () => {
        if (!this.manualClose && !settled) {
          settled = true
          window.clearTimeout(timeoutId)
          resolve({
            status: 'error',
            message: 'Connection error.',
          })
        } else if (!this.manualClose) {
          this.notifyError('Connection error.')
        }
      }

      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          return
        }

        this.handleMessage(event.data)
      }
    })
  }

  sendPcm(chunk: Uint8Array): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || chunk.length === 0) {
      return
    }

    this.socket.send(chunk)
  }

  async stop(): Promise<TranscriptionResult> {
    if (!this.socket) {
      return {
        status: 'empty',
        message: "I didn't hear that.",
      }
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'Finalize' }))
      await wait(DEEPGRAM_FINALIZE_WAIT_MS)
    }

    const transcript = this.getTranscript()

    this.close()

    if (!transcript) {
      return {
        status: 'empty',
        message: "I didn't hear that.",
      }
    }

    return {
      status: 'success',
      transcript,
      source: 'deepgram',
    }
  }

  close(): void {
    this.manualClose = true

    if (!this.socket) {
      return
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'CloseStream' }))
    }

    if (
      this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING
    ) {
      this.socket.close()
    }

    this.socket = undefined
  }

  getTranscript(): string {
    return joinTranscriptParts(this.finalTranscriptParts, this.latestInterimTranscript)
  }

  onTranscript(handler: TranscriptUpdateHandler): () => void {
    this.transcriptHandlers.add(handler)

    return () => {
      this.transcriptHandlers.delete(handler)
    }
  }

  onError(handler: TranscriptionErrorHandler): () => void {
    this.errorHandlers.add(handler)

    return () => {
      this.errorHandlers.delete(handler)
    }
  }

  private handleMessage(data: string): void {
    const message = parseDeepgramMessage(data)

    if (!message) {
      return
    }

    const transcript = getDeepgramTranscript(message)

    if (!transcript) {
      return
    }

    const isFinal = message.is_final === true || message.speech_final === true

    if (isFinal) {
      this.finalTranscriptParts.push(transcript)
      this.latestInterimTranscript = ''
    } else {
      this.latestInterimTranscript = transcript
    }

    this.notifyTranscript({
      transcript: this.getTranscript(),
      isFinal,
      source: 'deepgram',
    })
  }

  private notifyTranscript(update: TranscriptUpdate): void {
    this.transcriptHandlers.forEach((handler) => handler(update))
  }

  private notifyError(message: string): void {
    this.errorHandlers.forEach((handler) => handler(message))
  }
}
