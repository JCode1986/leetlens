import {
  OsEventTypeList,
  StartUpPageCreateResult,
  waitForEvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { EvenAppBridge, EvenHubEvent } from '@evenrealities/even_hub_sdk'
import './style.css'
import {
  applyVoiceSearchDecision,
  beginVoiceListening,
  createInitialNavigationState,
  setVoiceError,
  setVoiceProcessing,
  setVoiceTranscript,
  transitionNavigation,
} from './navigation/navigationState'
import type { NavigationContext, NavigationInput } from './navigation/navigationState'
import {
  addRecentProblem,
  getFavoriteIds,
  getRecentProblemIds,
  loadDefaultLanguagePreference,
  saveDefaultLanguagePreference,
  toggleFavorite,
} from './services/preferencesService'
import {
  getAllProblems,
  getCategories,
  getCollection,
  getCollections,
  getProblemById,
  getPatterns,
  getProblemsByCategory,
  getProblemsByDifficulty,
  getProblemsByPattern,
} from './services/problemService'
import { decideSearchResult } from './services/searchService'
import type { TranscriptUpdate } from './services/transcriptionService'
import { VoiceService } from './services/voiceService'
import {
  createRebuildPage,
  createStartUpPage,
  countEventCaptureContainers,
  renderTextObjectsDomPreview,
} from './screens/g2Layout'
import { createScreenTextObjects, getCurrentScreenPageCount } from './screens/renderScreen'
import { PROBLEM_FAVORITE_MENU_INDEX } from './types/navigation'
import type { NavigationState } from './types/navigation'
import type { Problem, ProblemId } from './types/problem'

type EvenHostWindow = Window & {
  flutter_inappwebview?: {
    callHandler?: (...args: unknown[]) => Promise<unknown>
  }
}

type InputEnvelopeType = 'listEvent' | 'textEvent' | 'sysEvent'

interface NormalizedEvenHubInput {
  envelopeType: InputEnvelopeType
  eventType: OsEventTypeList
  canNavigate: boolean
  containerID?: number
  containerName?: string
  selectedIndex?: number
}

interface EvenHubInputDebugInfo {
  hasTextEvent: boolean
  textType?: OsEventTypeList
  hasListEvent: boolean
  listType?: OsEventTypeList
  hasSysEvent: boolean
  sysType?: OsEventTypeList
  containerID?: number
  containerName?: string
  selectedIndex?: number
}

const ENABLE_INPUT_DEBUG_LOGS = true
const INPUT_EVENT_TYPES = new Set<OsEventTypeList>([
  OsEventTypeList.CLICK_EVENT,
  OsEventTypeList.SCROLL_TOP_EVENT,
  OsEventTypeList.SCROLL_BOTTOM_EVENT,
  OsEventTypeList.DOUBLE_CLICK_EVENT,
  OsEventTypeList.LONG_PRESS_EVENT,
  OsEventTypeList.LONG_PRESS_RELEASE_EVENT,
])

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('LeetLens requires an #app root element.')
}

function hasEvenHubHostBridge(): boolean {
  const hostWindow = window as EvenHostWindow

  return typeof hostWindow.flutter_inappwebview?.callHandler === 'function'
}

function normalizeEventType(rawEventType: OsEventTypeList | undefined): OsEventTypeList | undefined {
  if (rawEventType === undefined) {
    return undefined
  }

  return OsEventTypeList.fromJson(rawEventType)
}

function isGestureSysEvent(event: EvenHubEvent): boolean {
  if (!event.sysEvent) {
    return false
  }

  if (event.sysEvent.eventType !== undefined) {
    return true
  }

  return event.sysEvent.imuData === undefined && event.sysEvent.systemExitReasonCode === undefined
}

function isEvenHubClickEvent(event: EvenHubEvent): boolean {
  const listClick = event.listEvent !== undefined &&
    (
      normalizeEventType(event.listEvent.eventType) === OsEventTypeList.CLICK_EVENT ||
      event.listEvent.eventType === undefined
    )
  const textClick = event.textEvent !== undefined &&
    (
      normalizeEventType(event.textEvent.eventType) === OsEventTypeList.CLICK_EVENT ||
      event.textEvent.eventType === undefined
    )
  const sysClick = isGestureSysEvent(event) &&
    (
      normalizeEventType(event.sysEvent?.eventType) === OsEventTypeList.CLICK_EVENT ||
      event.sysEvent?.eventType === undefined
    )

  return listClick || textClick || sysClick
}

function isEvenHubDoubleClickEvent(event: EvenHubEvent): boolean {
  const listDoubleClick =
    normalizeEventType(event.listEvent?.eventType) === OsEventTypeList.DOUBLE_CLICK_EVENT
  const textDoubleClick =
    normalizeEventType(event.textEvent?.eventType) === OsEventTypeList.DOUBLE_CLICK_EVENT
  const sysDoubleClick =
    normalizeEventType(event.sysEvent?.eventType) === OsEventTypeList.DOUBLE_CLICK_EVENT

  return listDoubleClick || textDoubleClick || sysDoubleClick
}

function getEvenHubInputDebugInfo(event: EvenHubEvent): EvenHubInputDebugInfo | undefined {
  const textType = normalizeEventType(event.textEvent?.eventType)
  const listType = normalizeEventType(event.listEvent?.eventType)
  const sysType = normalizeEventType(event.sysEvent?.eventType)

  const hasGestureSysEvent = event.sysEvent !== undefined &&
    (
      event.sysEvent.eventType === undefined ||
      (sysType !== undefined && INPUT_EVENT_TYPES.has(sysType))
    ) &&
    isGestureSysEvent(event)

  if (!event.textEvent && !event.listEvent && !hasGestureSysEvent) {
    return undefined
  }

  return {
    hasTextEvent: event.textEvent !== undefined,
    textType,
    hasListEvent: event.listEvent !== undefined,
    listType,
    hasSysEvent: event.sysEvent !== undefined,
    sysType,
    containerID: event.textEvent?.containerID ?? event.listEvent?.containerID,
    containerName: event.textEvent?.containerName ?? event.listEvent?.containerName,
    selectedIndex: event.listEvent?.currentSelectItemIndex,
  }
}

function getEvenHubInput(event: EvenHubEvent): NormalizedEvenHubInput | undefined {
  if (event.listEvent) {
    return {
      envelopeType: 'listEvent',
      eventType: normalizeEventType(event.listEvent.eventType) ?? OsEventTypeList.CLICK_EVENT,
      canNavigate: true,
      containerID: event.listEvent.containerID,
      containerName: event.listEvent.containerName,
      selectedIndex: event.listEvent.currentSelectItemIndex,
    }
  }

  if (event.textEvent) {
    return {
      envelopeType: 'textEvent',
      eventType: normalizeEventType(event.textEvent.eventType) ?? OsEventTypeList.CLICK_EVENT,
      canNavigate: true,
      containerID: event.textEvent.containerID,
      containerName: event.textEvent.containerName,
    }
  }

  if (event.sysEvent) {
    const eventType = normalizeEventType(event.sysEvent.eventType)

    if (eventType === undefined) {
      return undefined
    }

    return {
      envelopeType: 'sysEvent',
      eventType,
      canNavigate: false,
    }
  }

  return undefined
}

function mapInputEvent(eventType: OsEventTypeList): NavigationInput | undefined {
  if (eventType === OsEventTypeList.SCROLL_TOP_EVENT) {
    return 'up'
  }

  if (eventType === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
    return 'down'
  }

  if (eventType === OsEventTypeList.CLICK_EVENT) {
    return 'select'
  }

  if (eventType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    return 'back'
  }

  return undefined
}

function logEvenHubEventDebug(
  debugInfo: EvenHubInputDebugInfo,
  clickDetected: boolean,
  doubleClickDetected: boolean,
): void {
  if (!ENABLE_INPUT_DEBUG_LOGS) {
    return
  }

  console.info('[LeetLens event]', debugInfo)

  if (clickDetected) {
    console.info('[LeetLens event] CLICK DETECTED')
  }

  if (doubleClickDetected) {
    console.info('[LeetLens event] DOUBLE CLICK DETECTED')
  }
}

function logEvenHubInput(
  input: NormalizedEvenHubInput,
  state: NavigationState,
  navigationInput?: NavigationInput,
): void {
  if (!ENABLE_INPUT_DEBUG_LOGS || !INPUT_EVENT_TYPES.has(input.eventType)) {
    return
  }

  console.info('[LeetLens input]', {
    envelopeType: input.envelopeType,
    eventType: input.eventType,
    eventName: OsEventTypeList[input.eventType],
    navigationInput: input.canNavigate ? navigationInput ?? 'unhandled' : 'ignored-system',
    containerID: input.containerID,
    containerName: input.containerName,
    selectedIndex: input.selectedIndex,
    currentScreen: state.currentScreen,
    selectedIndexBefore: state.selectedMenuIndex,
  })
}

async function startLeetLens(): Promise<void> {
  let navigationState = createInitialNavigationState(loadDefaultLanguagePreference())
  let nativeRenderQueue = Promise.resolve()
  let voiceService = new VoiceService()
  let voiceRunId = 0
  let lastVoiceTranscriptRenderMs = 0

  function getProblemListProblems(state: NavigationState): Problem[] {
    if (state.problemListSource === 'pattern' && state.selectedPattern) {
      return getProblemsByPattern(state.selectedPattern)
    }

    if (state.problemListSource === 'collection' && state.selectedCollection) {
      return getCollection(state.selectedCollection)
    }

    if (state.problemListSource === 'all') {
      return getAllProblems()
    }

    if (state.problemListSource === 'difficulty' && state.selectedDifficulty) {
      return getProblemsByDifficulty(state.selectedDifficulty)
    }

    if (state.problemListSource === 'favorites') {
      return resolveProblemIds(getFavoriteIds()).sort((a, b) => a.id - b.id)
    }

    if (state.problemListSource === 'recent') {
      return resolveProblemIds(getRecentProblemIds())
    }

    if (state.selectedCategory) {
      return getProblemsByCategory(state.selectedCategory)
    }

    return []
  }

  function getVoiceResultProblems(state: NavigationState): Problem[] {
    return state.voiceResultProblemIds
      .map((problemId) => getProblemById(problemId))
      .filter((problem): problem is Problem => problem !== undefined)
  }

  function resolveProblemIds(problemIds: ProblemId[]): Problem[] {
    return problemIds
      .map((problemId) => getProblemById(problemId))
      .filter((problem): problem is Problem => problem !== undefined)
  }

  function getNavigationContext(state: NavigationState): NavigationContext {
    return {
      categories: getCategories(),
      patterns: getPatterns(),
      collections: getCollections(),
      problemListProblems: getProblemListProblems(state),
      voiceResultProblems: getVoiceResultProblems(state),
      pageCount: getCurrentScreenPageCount(state),
    }
  }

  function renderBrowserPreview(): void {
    renderTextObjectsDomPreview(root, createScreenTextObjects(navigationState))
  }

  async function renderNative(bridge: EvenAppBridge, state: NavigationState): Promise<void> {
    const textObject = createScreenTextObjects(state)
    const captureCount = countEventCaptureContainers(textObject)

    if (captureCount !== 1) {
      console.error(`LeetLens page has ${captureCount} event-capture containers.`)
      return
    }

    const rebuilt = await bridge.rebuildPageContainer(createRebuildPage(textObject))

    if (!rebuilt) {
      console.error('Failed to rebuild LeetLens page container.')
    }
  }

  function applyNavigationState(nextState: NavigationState, bridge?: EvenAppBridge): void {
    const previousLanguage = navigationState.selectedLanguage
    const previousScreen = navigationState.currentScreen
    const previousProblemId = navigationState.selectedProblemId

    navigationState = nextState

    if (
      navigationState.currentScreen === 'problem' &&
      navigationState.selectedProblemId !== undefined &&
      (
        previousScreen !== 'problem' ||
        previousProblemId !== navigationState.selectedProblemId
      )
    ) {
      addRecentProblem(navigationState.selectedProblemId)
    }

    if (navigationState.selectedLanguage !== previousLanguage) {
      saveDefaultLanguagePreference(navigationState.selectedLanguage)
    }

    renderBrowserPreview()

    if (bridge) {
      const stateSnapshot = navigationState
      nativeRenderQueue = nativeRenderQueue.then(() => renderNative(bridge, stateSnapshot))
    }
  }

  function applyVoiceTranscriptUpdate(update: TranscriptUpdate, bridge?: EvenAppBridge): void {
    const now = Date.now()

    if (
      !update.isFinal &&
      now - lastVoiceTranscriptRenderMs < 250
    ) {
      return
    }

    lastVoiceTranscriptRenderMs = now
    applyNavigationState(setVoiceTranscript(navigationState, update.transcript), bridge)
  }

  async function startVoiceSearch(bridge?: EvenAppBridge): Promise<void> {
    const runId = voiceRunId + 1
    voiceRunId = runId
    lastVoiceTranscriptRenderMs = 0

    applyNavigationState(beginVoiceListening(navigationState), bridge)

    const startResult = await voiceService.startListening({
      onTranscript: (update) => {
        if (runId !== voiceRunId) {
          return
        }

        applyVoiceTranscriptUpdate(update, bridge)
      },
      onError: (message) => {
        if (runId !== voiceRunId) {
          return
        }

        voiceRunId += 1
        void voiceService.cancel()
        applyNavigationState(setVoiceError(navigationState, message), bridge)
      },
    })

    if (runId !== voiceRunId) {
      return
    }

    if (startResult.status !== 'success') {
      applyNavigationState(setVoiceError(navigationState, startResult.message), bridge)
    }
  }

  async function finishVoiceSearch(bridge?: EvenAppBridge): Promise<void> {
    const runId = voiceRunId

    applyNavigationState(setVoiceProcessing(navigationState), bridge)

    const transcription = await voiceService.stopListeningAndTranscribe()

    if (runId !== voiceRunId) {
      return
    }

    if (transcription.status !== 'success') {
      applyNavigationState(setVoiceError(navigationState, transcription.message), bridge)
      return
    }

    applyNavigationState(
      applyVoiceSearchDecision(navigationState, decideSearchResult(transcription.transcript)),
      bridge,
    )
  }

  function applyInput(input: NavigationInput, bridge?: EvenAppBridge): void {
    if (
      input === 'back' &&
      navigationState.currentScreen === 'voiceSearch' &&
      (
        navigationState.voiceSearchStatus === 'listening' ||
        navigationState.voiceSearchStatus === 'processing'
      )
    ) {
      voiceRunId += 1
      void voiceService.cancel()
    }

    if (
      input === 'select' &&
      navigationState.currentScreen === 'voiceSearch' &&
      navigationState.voiceSearchStatus !== 'processing'
    ) {
      if (navigationState.voiceSearchStatus === 'listening') {
        void finishVoiceSearch(bridge)
      } else {
        void startVoiceSearch(bridge)
      }

      return
    }

    if (
      input === 'select' &&
      navigationState.currentScreen === 'problem' &&
      navigationState.selectedMenuIndex === PROBLEM_FAVORITE_MENU_INDEX &&
      navigationState.selectedProblemId !== undefined
    ) {
      toggleFavorite(navigationState.selectedProblemId)
      applyNavigationState({ ...navigationState }, bridge)
      return
    }

    const previousState = navigationState
    const nextState = transitionNavigation(
      navigationState,
      input,
      getNavigationContext(navigationState),
    )

    if (ENABLE_INPUT_DEBUG_LOGS && (input === 'up' || input === 'down')) {
      console.info('[LeetLens navigation]', {
        input,
        currentScreen: previousState.currentScreen,
        selectedIndexBefore: previousState.selectedMenuIndex,
        selectedIndexAfter: nextState.selectedMenuIndex,
      })
    }

    applyNavigationState(nextState, bridge)
  }

  function handleEvenHubInput(event: EvenHubEvent, bridge: EvenAppBridge): void {
    voiceService.handleEvenHubEvent(event)

    const debugInfo = getEvenHubInputDebugInfo(event)
    const doubleClickDetected = isEvenHubDoubleClickEvent(event)
    const clickDetected = isEvenHubClickEvent(event)

    if (debugInfo) {
      logEvenHubEventDebug(debugInfo, clickDetected, doubleClickDetected)
    }

    if (doubleClickDetected) {
      applyInput('back', bridge)
      return
    }

    if (clickDetected) {
      applyInput('select', bridge)
      return
    }

    const input = getEvenHubInput(event)

    if (!input) {
      return
    }

    const navigationInput = input.canNavigate ? mapInputEvent(input.eventType) : undefined

    logEvenHubInput(input, navigationState, navigationInput)

    if (navigationInput) {
      applyInput(navigationInput, bridge)
    }
  }

  function handleBrowserKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      applyInput('up')
    } else if (event.key === 'ArrowDown') {
      applyInput('down')
    } else if (event.key === 'Enter') {
      applyInput('select')
    } else if (event.key === 'Backspace' || event.key === 'Escape') {
      applyInput('back')
    } else {
      return
    }

    event.preventDefault()
  }

  renderBrowserPreview()
  window.addEventListener('keydown', handleBrowserKeyDown)

  if (!hasEvenHubHostBridge()) {
    console.info('Even Hub host bridge not found; showing browser preview only.')
    return
  }

  const bridge = await waitForEvenAppBridge()
  voiceService = new VoiceService(bridge)
  const startupTextObject = createScreenTextObjects(navigationState)
  const startupCaptureCount = countEventCaptureContainers(startupTextObject)

  if (startupCaptureCount !== 1) {
    console.error(`LeetLens startup page has ${startupCaptureCount} event-capture containers.`)
    return
  }

  const result = await bridge.createStartUpPageContainer(
    createStartUpPage(startupTextObject),
  )

  if (result !== StartUpPageCreateResult.success) {
    console.error(`Failed to create LeetLens startup page: ${StartUpPageCreateResult[result]}`)
    return
  }

  bridge.onEvenHubEvent((event) => handleEvenHubInput(event, bridge))
}

void startLeetLens().catch((error: unknown) => {
  console.error('LeetLens startup failed', error)
})
