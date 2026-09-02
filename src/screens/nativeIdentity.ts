import type { TextContainerProperty } from '@evenrealities/even_hub_sdk'
import type { NavigationScreen, NavigationState } from '../types/navigation'

const SUPPORTED_TEXT_CONTAINER_KEYS = new Set([
  'xPosition',
  'yPosition',
  'width',
  'height',
  'borderWidth',
  'borderColor',
  'borderRadius',
  'paddingLength',
  'containerID',
  'containerName',
  'isEventCapture',
  'zOrderIndex',
  'content',
  'textColor',
])

interface NativeIdentitySlot {
  containerID: number | undefined
  containerName: string | undefined
}

export interface NativeIdentityTransitionSlotDiagnostic {
  ordinal: number
  previousContainerID: number | undefined
  previousContainerName: string | undefined
  nextContainerID: number | undefined
  nextContainerName: string | undefined
  identityPreserved: boolean
  isNewOrdinal: boolean
  identitySource: 'previous-screen' | 'retained-accepted-pool' | 'renderer-generated-first-use'
}

export interface NativeIdentityTransitionDiagnostic {
  previousScreen: NavigationScreen
  nextScreen: NavigationScreen
  previousCount: number
  nextCount: number
  slots: NativeIdentityTransitionSlotDiagnostic[]
}

let acceptedNativeIdentitySlots: NativeIdentitySlot[] = []
const currentLogicalTargetsByNativeName = new Map<string, string>()
const currentLogicalTargetsByNativeID = new Map<number, string>()
let lastNativeIdentityTransitionDiagnostic: NativeIdentityTransitionDiagnostic | undefined

const PRESERVED_NATIVE_IDENTITY_SCREENS = new Set<NavigationScreen>([
  'home',
  'exitConfirm',
  'categories',
  'collections',
  'find',
  'study',
  'studyPattern',
  'studyQuestion',
  'studyFeedback',
  'voiceSearch',
  'voiceMatch',
  'voiceResults',
  'difficultyList',
  'settings',
  'language',
  'problemList',
  'problem',
  'quickAnswer',
  'hint',
  'approach',
  'pseudocode',
  'solution',
  'edgeCases',
])

function captureNativeIdentitySlots(textObject: TextContainerProperty[]): NativeIdentitySlot[] {
  return textObject.map((container) => ({
    containerID: container.containerID,
    containerName: container.containerName,
  }))
}

function clearCurrentLogicalTargets(): void {
  currentLogicalTargetsByNativeName.clear()
  currentLogicalTargetsByNativeID.clear()
}

function setCurrentLogicalTargets(
  nativeTextObject: TextContainerProperty[],
  logicalContainerNames: Array<string | undefined>,
): void {
  clearCurrentLogicalTargets()

  nativeTextObject.forEach((container, index) => {
    const logicalContainerName = logicalContainerNames[index]

    if (!logicalContainerName) {
      return
    }

    if (container.containerName) {
      currentLogicalTargetsByNativeName.set(container.containerName, logicalContainerName)
    }

    if (container.containerID !== undefined) {
      currentLogicalTargetsByNativeID.set(container.containerID, logicalContainerName)
    }
  })
}

function applyNativeIdentitySlots(
  textObject: TextContainerProperty[],
  identitySlots: NativeIdentitySlot[],
): TextContainerProperty[] {
  const sharedSlotCount = Math.min(textObject.length, identitySlots.length)

  for (let index = 0; index < sharedSlotCount; index += 1) {
    textObject[index].containerID = identitySlots[index].containerID
    textObject[index].containerName = identitySlots[index].containerName
  }

  return textObject
}

function getIdentitySource(
  ordinal: number,
  previousTextObject: TextContainerProperty[],
  identitySlots: NativeIdentitySlot[],
): NativeIdentityTransitionSlotDiagnostic['identitySource'] {
  if (ordinal < previousTextObject.length) {
    return 'previous-screen'
  }

  if (identitySlots[ordinal]) {
    return 'retained-accepted-pool'
  }

  return 'renderer-generated-first-use'
}

function createNativeIdentityTransitionDiagnostic(
  previousScreen: NavigationScreen,
  nextScreen: NavigationScreen,
  previousTextObject: TextContainerProperty[],
  nextTextObject: TextContainerProperty[],
  identitySlots: NativeIdentitySlot[],
): NativeIdentityTransitionDiagnostic {
  return {
    previousScreen,
    nextScreen,
    previousCount: previousTextObject.length,
    nextCount: nextTextObject.length,
    slots: Array.from({ length: nextTextObject.length }, (_, ordinal) => {
      const previousContainer = previousTextObject[ordinal]
      const nextContainer = nextTextObject[ordinal]
      const identitySource = getIdentitySource(ordinal, previousTextObject, identitySlots)

      return {
        ordinal,
        previousContainerID: previousContainer?.containerID,
        previousContainerName: previousContainer?.containerName,
        nextContainerID: nextContainer.containerID,
        nextContainerName: nextContainer.containerName,
        identityPreserved: previousContainer === undefined ||
          previousContainer.containerID === nextContainer.containerID &&
          previousContainer.containerName === nextContainer.containerName,
        isNewOrdinal: previousContainer === undefined,
        identitySource,
      }
    }),
  }
}

function parseTargetContainerIndex(containerName: string | undefined): number | undefined {
  const match = containerName?.match(/-(\d+)(?:-\d+)?$/)

  if (!match) {
    return undefined
  }

  return Number.parseInt(match[1], 10)
}

function isPreservedNativeIdentityState(state: NavigationState | undefined): boolean {
  if (!state || !PRESERVED_NATIVE_IDENTITY_SCREENS.has(state.currentScreen)) {
    return false
  }

  if (state.currentScreen === 'problemList') {
    return state.problemListSource !== 'favorites' && state.problemListSource !== 'recent'
  }

  return true
}

function updateAcceptedNativeIdentitySlots(identitySlots: NativeIdentitySlot[]): void {
  identitySlots.forEach((slot, index) => {
    acceptedNativeIdentitySlots[index] = slot
  })
}

export function recordAcceptedNativeTextObjects(textObject: TextContainerProperty[]): void {
  updateAcceptedNativeIdentitySlots(captureNativeIdentitySlots(textObject))
}

export function resetNativeIdentityForTests(): void {
  acceptedNativeIdentitySlots = []
  clearCurrentLogicalTargets()
  lastNativeIdentityTransitionDiagnostic = undefined
}

export function prepareNativeTextObjectsForRebuild(
  previousState: NavigationState | undefined,
  previousTextObject: TextContainerProperty[] | undefined,
  nextState: NavigationState,
  nextTextObject: TextContainerProperty[],
): TextContainerProperty[] {
  if (
    isPreservedNativeIdentityState(previousState) &&
    previousTextObject !== undefined
  ) {
    recordAcceptedNativeTextObjects(previousTextObject)
  }

  if (
    !isPreservedNativeIdentityState(nextState) ||
    !isPreservedNativeIdentityState(previousState) ||
    acceptedNativeIdentitySlots.length === 0
  ) {
    clearCurrentLogicalTargets()
    return nextTextObject
  }

  const logicalContainerNames = nextTextObject.map((container) => container.containerName)
  const identitySlots = [...acceptedNativeIdentitySlots]
  const nativeTextObject = applyNativeIdentitySlots(nextTextObject, identitySlots)

  setCurrentLogicalTargets(nativeTextObject, logicalContainerNames)

  if (previousState && previousTextObject) {
    lastNativeIdentityTransitionDiagnostic = createNativeIdentityTransitionDiagnostic(
      previousState.currentScreen,
      nextState.currentScreen,
      previousTextObject,
      nativeTextObject,
      identitySlots,
    )
  }

  return nativeTextObject
}

export function resolveLogicalContainerName(
  containerName: string | undefined,
  containerID: number | undefined,
): string | undefined {
  if (containerName) {
    const logicalContainerName = currentLogicalTargetsByNativeName.get(containerName)

    if (logicalContainerName) {
      return logicalContainerName
    }
  }

  if (containerID !== undefined) {
    const logicalContainerName = currentLogicalTargetsByNativeID.get(containerID)

    if (logicalContainerName) {
      return logicalContainerName
    }
  }

  return containerName
}

export function getTargetContainerIndex(
  containerName: string | undefined,
  containerID?: number,
): number | undefined {
  return parseTargetContainerIndex(resolveLogicalContainerName(containerName, containerID))
}

export function getLastNativeIdentityTransitionDiagnostic():
  NativeIdentityTransitionDiagnostic | undefined {
  return lastNativeIdentityTransitionDiagnostic
}

export function getUnsupportedNativeContainerKeys(
  textObject: TextContainerProperty[],
): string[] {
  const unsupportedKeys = new Set<string>()

  for (const container of textObject) {
    for (const key of Object.keys(container)) {
      if (!SUPPORTED_TEXT_CONTAINER_KEYS.has(key)) {
        unsupportedKeys.add(key)
      }
    }
  }

  return [...unsupportedKeys].sort()
}
