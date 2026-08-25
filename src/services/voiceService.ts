import { AudioInputSource } from '@evenrealities/even_hub_sdk'
import type { EvenAppBridge, EvenHubEvent } from '@evenrealities/even_hub_sdk'
import { createStreamingTranscriptionService } from './transcriptionService'
import type {
  StreamingTranscriptionService,
  TranscriptUpdate,
  TranscriptionResult,
  TranscriptionStartResult,
} from './transcriptionService'

export type VoiceStartResult = TranscriptionStartResult

export interface VoiceListeningOptions {
  onTranscript?: (update: TranscriptUpdate) => void
  onError?: (message: string) => void
}

export class VoiceService {
  private frameCount = 0
  private byteCount = 0
  private listening = false
  private transcriptionService: StreamingTranscriptionService | undefined
  private unsubscribeTranscript: (() => void) | undefined
  private unsubscribeError: (() => void) | undefined
  private readonly bridge: EvenAppBridge | undefined

  constructor(bridge?: EvenAppBridge) {
    this.bridge = bridge
  }

  handleEvenHubEvent(event: EvenHubEvent): void {
    if (!this.listening || !event.audioEvent) {
      return
    }

    this.frameCount += 1
    this.byteCount += event.audioEvent.audioPcm.length
    this.transcriptionService?.sendPcm(event.audioEvent.audioPcm)
  }

  async startListening(options: VoiceListeningOptions = {}): Promise<VoiceStartResult> {
    await this.cancel()

    this.frameCount = 0
    this.byteCount = 0
    this.transcriptionService = createStreamingTranscriptionService()

    if (options.onTranscript) {
      this.unsubscribeTranscript = this.transcriptionService.onTranscript(options.onTranscript)
    }

    if (options.onError) {
      this.unsubscribeError = this.transcriptionService.onError(options.onError)
    }

    const transcriptionStart = await this.transcriptionService.start()

    if (transcriptionStart.status !== 'success') {
      this.disposeTranscription()
      return transcriptionStart
    }

    const micStarted = await this.startMicrophone()

    if (!micStarted) {
      this.disposeTranscription()

      return {
        status: 'error',
        message: 'Microphone unavailable.',
      }
    }

    this.listening = true

    return { status: 'success' }
  }

  async stopListeningAndTranscribe(): Promise<TranscriptionResult> {
    this.listening = false
    await this.stopMicrophone()

    const transcriptionResult = this.transcriptionService
      ? await this.transcriptionService.stop()
      : {
          status: 'empty',
          message: "I didn't hear that.",
        } as const

    this.disposeTranscription()

    if (transcriptionResult.status === 'empty' && this.frameCount === 0) {
      return {
        status: 'empty',
        message: 'No audio captured.',
      }
    }

    return transcriptionResult
  }

  async cancel(): Promise<void> {
    this.listening = false
    await this.stopMicrophone()
    this.disposeTranscription()
  }

  private async startMicrophone(): Promise<boolean> {
    if (!this.bridge) {
      return true
    }

    try {
      return await this.bridge.audioControl(true, AudioInputSource.Glasses)
    } catch {
      return false
    }
  }

  private async stopMicrophone(): Promise<void> {
    if (!this.bridge) {
      return
    }

    try {
      await this.bridge.audioControl(false)
    } catch {
      // Best-effort cleanup only.
    }
  }

  private disposeTranscription(): void {
    this.unsubscribeTranscript?.()
    this.unsubscribeError?.()
    this.unsubscribeTranscript = undefined
    this.unsubscribeError = undefined
    this.transcriptionService?.close()
    this.transcriptionService = undefined
  }
}
