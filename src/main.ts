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

type GestureInput = 'click' | 'doubleClick' | 'longPress'

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

function getCurrentSelectableIndex(state: NavigationState): number {
  if (state.currentScreen === 'studyQuestion' || state.currentScreen === 'studyFeedback') {
    return state.studySelectedIndex
  }

  return state.selectedMenuIndex
}

function getTargetContainerIndex(containerName: string | undefined): number | undefined {
  const match = containerName?.match(/-(\d+)(?:-\d+)?$/)

  if (!match) {
    return undefined
  }

  return Number.parseInt(match[1], 10)
}

function getTargetIndexInput(event: EvenHubEvent, state: NavigationState): NavigationInput | undefined {
  const eventTypes = [
    normalizeEventType(event.listEvent?.eventType),
    normalizeEventType(event.textEvent?.eventType),
    normalizeEventType(event.sysEvent?.eventType),
  ]

  if (eventTypes.some((eventType) => eventType !== undefined)) {
    return undefined
  }

  const targetIndex = event.listEvent?.currentSelectItemIndex ??
    getTargetContainerIndex(event.textEvent?.containerName ?? event.listEvent?.containerName)

  if (targetIndex === undefined) {
    return undefined
  }

  const currentIndex = getCurrentSelectableIndex(state)

  if (targetIndex > currentIndex) {
    return 'down'
  }

  if (targetIndex < currentIndex) {
    return 'up'
  }

  return undefined
}

function getExplicitScrollInput(event: EvenHubEvent): NavigationInput | undefined {
  const eventTypes = [
    normalizeEventType(event.listEvent?.eventType),
    normalizeEventType(event.textEvent?.eventType),
    normalizeEventType(event.sysEvent?.eventType),
  ]

  if (eventTypes.some((eventType) => eventType === OsEventTypeList.SCROLL_TOP_EVENT)) {
    return 'up'
  }

  if (eventTypes.some((eventType) => eventType === OsEventTypeList.SCROLL_BOTTOM_EVENT)) {
    return 'down'
  }

  return undefined
}

function normalizeGesture(event: EvenHubEvent): GestureInput | undefined {
  const entries = [
    normalizeEventType(event.listEvent?.eventType),
    normalizeEventType(event.textEvent?.eventType),
    normalizeEventType(event.sysEvent?.eventType),
  ]

  if (entries.some((eventType) => eventType === OsEventTypeList.DOUBLE_CLICK_EVENT)) {
    return 'doubleClick'
  }

  if (entries.some((eventType) => eventType === OsEventTypeList.LONG_PRESS_EVENT)) {
    return 'longPress'
  }

  if (entries.some((eventType) => eventType === OsEventTypeList.CLICK_EVENT)) {
    return 'click'
  }

  const hasInputEnvelope = event.listEvent !== undefined ||
    event.textEvent !== undefined ||
    isGestureSysEvent(event)
  const hasEventType = entries.some((eventType) => eventType !== undefined)

  if (hasInputEnvelope && !hasEventType) {
    return 'click'
  }

  return undefined
}

function isLongPressReleaseEvent(event: EvenHubEvent): boolean {
  const eventTypes = [
    normalizeEventType(event.listEvent?.eventType),
    normalizeEventType(event.textEvent?.eventType),
    normalizeEventType(event.sysEvent?.eventType),
  ]

  return eventTypes.some((eventType) => eventType === OsEventTypeList.LONG_PRESS_RELEASE_EVENT)
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

    const previousContext = getNavigationContext(navigationState)
    const nextState = transitionNavigation(
      navigationState,
      input,
      previousContext,
    )

    applyNavigationState(nextState, bridge)
  }

  function returnHome(bridge?: EvenAppBridge): void {
    if (navigationState.currentScreen === 'home') {
      return
    }

    if (
      navigationState.currentScreen === 'voiceSearch' &&
      (
        navigationState.voiceSearchStatus === 'listening' ||
        navigationState.voiceSearchStatus === 'processing'
      )
    ) {
      voiceRunId += 1
      void voiceService.cancel()
    }

    applyNavigationState({
      ...navigationState,
      currentScreen: 'home',
      selectedMenuIndex: 0,
      codePageIndex: 0,
      voiceSearchStatus: 'idle',
      voiceError: undefined,
    }, bridge)
  }

  function handleEvenHubInput(event: EvenHubEvent, bridge: EvenAppBridge): void {
    voiceService.handleEvenHubEvent(event)

    const explicitScrollInput = getExplicitScrollInput(event)

    if (explicitScrollInput) {
      applyInput(explicitScrollInput, bridge)
      return
    }

    const targetIndexInput = getTargetIndexInput(event, navigationState)

    if (targetIndexInput) {
      applyInput(targetIndexInput, bridge)
      return
    }

    const gesture = normalizeGesture(event)

    if (gesture) {
      if (gesture === 'click') {
        applyInput('select', bridge)
        return
      }

      if (gesture === 'doubleClick') {
        applyInput('back', bridge)
        return
      }

      returnHome(bridge)
      return
    }

    if (isLongPressReleaseEvent(event)) {
      return
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
