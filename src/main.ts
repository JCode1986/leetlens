import {
  OsEventTypeList,
  StartUpPageCreateResult,
  waitForEvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { EvenAppBridge, EvenHubEvent } from '@evenrealities/even_hub_sdk'
import './style.css'
import {
  createInitialNavigationState,
  transitionNavigation,
} from './navigation/navigationState'
import type { NavigationContext, NavigationInput } from './navigation/navigationState'
import {
  loadDefaultLanguagePreference,
  saveDefaultLanguagePreference,
} from './services/preferencesService'
import {
  getCategories,
  getCollection,
  getCollections,
  getPatterns,
  getProblemsByCategory,
  getProblemsByPattern,
} from './services/problemService'
import {
  createRebuildPage,
  createStartUpPage,
  countEventCaptureContainers,
  renderTextObjectsDomPreview,
} from './screens/g2Layout'
import { createScreenTextObjects, getCurrentScreenPageCount } from './screens/renderScreen'
import type { NavigationState } from './types/navigation'

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

function logEvenHubInput(input: NormalizedEvenHubInput, navigationInput?: NavigationInput): void {
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
  })
}

async function startLeetLens(): Promise<void> {
  let navigationState = createInitialNavigationState(loadDefaultLanguagePreference())
  let nativeRenderQueue = Promise.resolve()

  function getNavigationContext(state: NavigationState): NavigationContext {
    const problemListProblems = (() => {
      if (state.problemListSource === 'pattern' && state.selectedPattern) {
        return getProblemsByPattern(state.selectedPattern)
      }

      if (state.problemListSource === 'collection' && state.selectedCollection) {
        return getCollection(state.selectedCollection)
      }

      if (state.selectedCategory) {
        return getProblemsByCategory(state.selectedCategory)
      }

      return []
    })()

    return {
      categories: getCategories(),
      patterns: getPatterns(),
      collections: getCollections(),
      problemListProblems,
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

  function applyInput(input: NavigationInput, bridge?: EvenAppBridge): void {
    const previousLanguage = navigationState.selectedLanguage

    navigationState = transitionNavigation(
      navigationState,
      input,
      getNavigationContext(navigationState),
    )

    if (navigationState.selectedLanguage !== previousLanguage) {
      saveDefaultLanguagePreference(navigationState.selectedLanguage)
    }

    renderBrowserPreview()

    if (bridge) {
      const stateSnapshot = navigationState
      nativeRenderQueue = nativeRenderQueue.then(() => renderNative(bridge, stateSnapshot))
    }
  }

  function handleEvenHubInput(event: EvenHubEvent, bridge: EvenAppBridge): void {
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

    logEvenHubInput(input, navigationInput)

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
