import type { TextContainerProperty } from '@evenrealities/even_hub_sdk'
import {
  transitionNavigation,
  transitionNavigationToIndex,
} from '../navigation/navigationState'
import { getProblemListProblems } from '../services/problemListService'
import type { NavigationContext } from '../navigation/navigationState'
import { createInitialNavigationState } from '../navigation/navigationState'
import {
  getCategories,
  getCollections,
  getExistingProblemsById,
  getPatterns,
} from '../services/problemService'
import { PROBLEM_TABS } from '../types/navigation'
import type { NavigationScreen, NavigationState, ProblemTab } from '../types/navigation'
import { createProblemTextObjects } from './problem'
import { createProblemListTextObjects } from './problemList'
import { countEventCaptureContainers } from './g2Layout'
import { createScreenTextObjects, getCurrentScreenPageCount } from './renderScreen'
import {
  getLastNativeIdentityTransitionDiagnostic,
  getTargetContainerIndex,
  getUnsupportedNativeContainerKeys,
  prepareNativeTextObjectsForRebuild,
  recordAcceptedNativeTextObjects,
  resetNativeIdentityForTests,
  resolveLogicalContainerName,
} from './nativeIdentity'

const FORBIDDEN_NATIVE_METADATA_KEYS = [
  'logicalContainerName',
  'logicalIndex',
  'slot',
  'screenName',
  'debug',
]

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`)
  }
}

function assertNotEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    throw new Error(`${message}: did not expect ${String(expected)}`)
  }
}

function assertSharedNativeIdentitiesMatch(
  previousTextObject: TextContainerProperty[],
  nextTextObject: TextContainerProperty[],
  label = 'shared slots',
): void {
  const sharedSlotCount = Math.min(previousTextObject.length, nextTextObject.length)

  for (let index = 0; index < sharedSlotCount; index += 1) {
    assertEqual(
      nextTextObject[index].containerID,
      previousTextObject[index].containerID,
      `${label} slot ${index} should preserve containerID`,
    )
    assertEqual(
      nextTextObject[index].containerName,
      previousTextObject[index].containerName,
      `${label} slot ${index} should preserve containerName`,
    )
  }
}

function assertIdentityPoolApplied(
  identityPool: TextContainerProperty[],
  textObject: TextContainerProperty[],
  label: string,
): void {
  const sharedSlotCount = Math.min(identityPool.length, textObject.length)

  for (let index = 0; index < sharedSlotCount; index += 1) {
    assertEqual(
      textObject[index].containerID,
      identityPool[index].containerID,
      `${label} slot ${index} should use the stable pool containerID`,
    )
    assertEqual(
      textObject[index].containerName,
      identityPool[index].containerName,
      `${label} slot ${index} should use the stable pool containerName`,
    )
  }
}

function assertLatestDiagnosticPreserved(
  previousScreen: NavigationScreen,
  nextScreen: NavigationScreen,
): void {
  const diagnostic = getLastNativeIdentityTransitionDiagnostic()

  assert(diagnostic, `${previousScreen} -> ${nextScreen} diagnostic should be recorded`)
  assertEqual(diagnostic.previousScreen, previousScreen, 'diagnostic previous screen should match')
  assertEqual(diagnostic.nextScreen, nextScreen, 'diagnostic next screen should match')
  diagnostic.slots.forEach((slot) => {
    assert(slot.identityPreserved, `diagnostic slot ${slot.ordinal} should preserve identity`)
  })
}

function assertNoInternalMetadata(textObject: TextContainerProperty[]): void {
  assertEqual(getUnsupportedNativeContainerKeys(textObject).length, 0, 'native containers should only use SDK keys')

  textObject.forEach((container, index) => {
    for (const key of FORBIDDEN_NATIVE_METADATA_KEYS) {
      assert(
        !Object.hasOwn(container, key),
        `slot ${index} should not include internal metadata key "${key}"`,
      )
    }
  })
}

function createProblemListState(selectedMenuIndex = 0): NavigationState {
  return {
    ...createInitialNavigationState(),
    currentScreen: 'problemList',
    problemListSource: 'all',
    selectedMenuIndex,
  }
}

function createProblemStateFromList(
  problemListState: NavigationState,
  problemIndex: number,
): NavigationState {
  const selectedProblem = getProblemListProblems(problemListState)[problemIndex]

  assert(selectedProblem, `expected problem at index ${problemIndex}`)

  return {
    ...problemListState,
    currentScreen: 'problem',
    selectedProblemId: selectedProblem.id,
    problemEntrySource: 'problemList',
    selectedProblemTab: 'quickAnswer',
    selectedMenuIndex: 0,
    codePageIndex: 0,
  }
}

function createNavigationContext(state: NavigationState): NavigationContext {
  return {
    categories: getCategories(),
    patterns: getPatterns(),
    collections: getCollections(),
    problemListProblems: getProblemListProblems(state),
    voiceResultProblems: getExistingProblemsById(state.voiceResultProblemIds),
    pageCount: 1,
  }
}

function createPagedNavigationContext(state: NavigationState): NavigationContext {
  return {
    ...createNavigationContext(state),
    pageCount: getCurrentScreenPageCount(state),
  }
}

function assertNormalProblemListIdentities(problemListTextObject: TextContainerProperty[]): void {
  const expectedContainerNames = [
    'problem-capture',
    'problem-title',
    'problem-0',
    'problem-1',
    'problem-2',
    'problem-3',
    'problem-4',
    'problem-5',
  ]

  assertEqual(problemListTextObject.length, expectedContainerNames.length, 'problemList should render 8 containers')

  expectedContainerNames.forEach((containerName, index) => {
    assertEqual(
      problemListTextObject[index].containerID,
      1000 + index,
      `problemList slot ${index} should use normal containerID`,
    )
    assertEqual(
      problemListTextObject[index].containerName,
      containerName,
      `problemList slot ${index} should use normal containerName`,
    )
  })
}

function assertProblemLayoutPreserved(
  baseProblemTextObject: TextContainerProperty[],
  stableProblemTextObject: TextContainerProperty[],
): void {
  stableProblemTextObject.forEach((container, index) => {
    const baseContainer = baseProblemTextObject[index]

    assertEqual(container.xPosition, baseContainer.xPosition, `slot ${index} xPosition should be preserved`)
    assertEqual(container.yPosition, baseContainer.yPosition, `slot ${index} yPosition should be preserved`)
    assertEqual(container.width, baseContainer.width, `slot ${index} width should be preserved`)
    assertEqual(container.height, baseContainer.height, `slot ${index} height should be preserved`)
    assertEqual(container.content, baseContainer.content, `slot ${index} content should be preserved`)
    assertEqual(container.textColor, baseContainer.textColor, `slot ${index} textColor should be preserved`)
  })
}

function assertLogicalMappingMatches(
  nativeTextObject: TextContainerProperty[],
  logicalTextObject: TextContainerProperty[],
  index: number,
  label: string,
): void {
  assertEqual(
    resolveLogicalContainerName(
      nativeTextObject[index].containerName,
      nativeTextObject[index].containerID,
    ),
    logicalTextObject[index].containerName,
    `${label} slot ${index} should preserve logical container name separately`,
  )
}

function createProblemScreenState(
  problemState: NavigationState,
  selectedMenuIndex: number,
  selectedProblemTab: ProblemTab,
): NavigationState {
  return {
    ...problemState,
    currentScreen: 'problem',
    selectedMenuIndex,
    selectedProblemTab,
    codePageIndex: 0,
  }
}

function createProblemContentState(
  problemState: NavigationState,
  screen: ProblemTab,
  codePageIndex = 0,
): NavigationState {
  return {
    ...problemState,
    currentScreen: screen,
    selectedProblemTab: screen,
    selectedMenuIndex: 0,
    codePageIndex,
  }
}

function prepareAndAssertTransition(
  previousState: NavigationState,
  previousTextObject: TextContainerProperty[],
  nextState: NavigationState,
  identityPool: TextContainerProperty[],
): TextContainerProperty[] {
  const logicalTextObject = createScreenTextObjects(nextState)
  const nativeTextObject = prepareNativeTextObjectsForRebuild(
    previousState,
    previousTextObject,
    nextState,
    createScreenTextObjects(nextState),
  )
  const label = `${previousState.currentScreen} -> ${nextState.currentScreen}`

  assertSharedNativeIdentitiesMatch(previousTextObject, nativeTextObject, label)
  assertIdentityPoolApplied(identityPool, nativeTextObject, label)
  assertEqual(countEventCaptureContainers(nativeTextObject), 1, `${label} should have one event capture`)
  assertNoInternalMetadata(nativeTextObject)
  assertLogicalMappingMatches(nativeTextObject, logicalTextObject, 0, label)
  assertLatestDiagnosticPreserved(previousState.currentScreen, nextState.currentScreen)
  recordAcceptedNativeTextObjects(nativeTextObject)

  return nativeTextObject
}

function prepareAndAssertRealTransition(
  previousState: NavigationState,
  previousTextObject: TextContainerProperty[],
  input: 'select' | 'back' | 'up' | 'down',
  identityPool: TextContainerProperty[],
): [NavigationState, TextContainerProperty[]] {
  const context = createPagedNavigationContext(previousState)
  const nextState = transitionNavigation(previousState, input, context)
  const nextTextObject = prepareAndAssertTransition(
    previousState,
    previousTextObject,
    nextState,
    identityPool,
  )

  return [nextState, nextTextObject]
}

function prepareAndAssertDirectState(
  previousState: NavigationState,
  previousTextObject: TextContainerProperty[],
  nextState: NavigationState,
  identityPool: TextContainerProperty[],
): [NavigationState, TextContainerProperty[]] {
  return [
    nextState,
    prepareAndAssertTransition(previousState, previousTextObject, nextState, identityPool),
  ]
}

function runProblemDetailSubtreeSequence(
  problemState: NavigationState,
  problemListTextObject: TextContainerProperty[],
  stableProblemTextObject: TextContainerProperty[],
): void {
  const identityPool = problemListTextObject
  let currentState = problemState
  let currentTextObject = stableProblemTextObject

  PROBLEM_TABS.forEach((tab, selectedMenuIndex) => {
    const selectedProblemState = createProblemScreenState(problemState, selectedMenuIndex, tab.screen)
    const selectedProblemTextObject = prepareAndAssertTransition(
      currentState,
      currentTextObject,
      selectedProblemState,
      identityPool,
    )

    assertEqual(
      getTargetContainerIndex(
        selectedProblemTextObject[1].containerName,
        selectedProblemTextObject[1].containerID,
      ),
      selectedMenuIndex,
      `${tab.screen} selected problem menu should resolve to logical menu index`,
    )

    const contentState = createProblemContentState(problemState, tab.screen)
    const contentTextObject = prepareAndAssertTransition(
      selectedProblemState,
      selectedProblemTextObject,
      contentState,
      identityPool,
    )
    const contentLogicalTextObject = createScreenTextObjects(contentState)

    assertLogicalMappingMatches(contentTextObject, contentLogicalTextObject, 0, tab.screen)
    assertEqual(
      getTargetContainerIndex(
        contentTextObject[0].containerName,
        contentTextObject[0].containerID,
      ),
      0,
      `${tab.screen} first page should resolve to logical page index 0`,
    )

    const pageCount = getCurrentScreenPageCount(contentState)
    let latestContentState = contentState
    let latestContentTextObject = contentTextObject

    if (pageCount > 1) {
      const secondPageState = createProblemContentState(problemState, tab.screen, 1)
      const secondPageTextObject = prepareAndAssertTransition(
        contentState,
        contentTextObject,
        secondPageState,
        identityPool,
      )
      const secondPageLogicalTextObject = createScreenTextObjects(secondPageState)

      assertSharedNativeIdentitiesMatch(contentTextObject, secondPageTextObject, `${tab.screen} pagination`)
      assertLogicalMappingMatches(secondPageTextObject, secondPageLogicalTextObject, 0, `${tab.screen} pagination`)
      assertEqual(
        getTargetContainerIndex(
          secondPageTextObject[0].containerName,
          secondPageTextObject[0].containerID,
        ),
        1,
        `${tab.screen} second page should resolve to logical page index 1`,
      )

      latestContentState = secondPageState
      latestContentTextObject = secondPageTextObject
    }

    const returnedProblemState = createProblemScreenState(problemState, selectedMenuIndex, tab.screen)
    const returnedProblemTextObject = prepareAndAssertTransition(
      latestContentState,
      latestContentTextObject,
      returnedProblemState,
      identityPool,
    )

    assertEqual(returnedProblemTextObject.length, stableProblemTextObject.length, 'problem count should be restored')

    currentState = returnedProblemState
    currentTextObject = returnedProblemTextObject
  })
}

export function runProblemListToProblemNativeIdentityTest(): void {
  resetNativeIdentityForTests()

  const problemListState = createProblemListState()
  const problemListTextObject = createProblemListTextObjects(problemListState)
  const problemState = createProblemStateFromList(problemListState, 0)
  const baseProblemTextObject = createProblemTextObjects(problemState)
  const stableProblemTextObject = prepareNativeTextObjectsForRebuild(
    problemListState,
    problemListTextObject,
    problemState,
    createProblemTextObjects(problemState),
  )

  assertNormalProblemListIdentities(problemListTextObject)
  assertEqual(baseProblemTextObject.length, 5, 'baseline problem detail should currently render 5 containers')
  assertEqual(stableProblemTextObject.length, 5, 'stable problem detail should keep current container count')
  assert(stableProblemTextObject.length < problemListTextObject.length, 'problemList -> problem may reduce count')
  assertSharedNativeIdentitiesMatch(problemListTextObject, stableProblemTextObject, 'problemList -> problem')
  assertIdentityPoolApplied(problemListTextObject, stableProblemTextObject, 'problemList -> problem')
  assertProblemLayoutPreserved(baseProblemTextObject, stableProblemTextObject)
  recordAcceptedNativeTextObjects(stableProblemTextObject)
  assertNotEqual(
    stableProblemTextObject[1].content,
    problemListTextObject[1].content,
    'problem content may differ while native identity is preserved',
  )
  assertNotEqual(
    stableProblemTextObject[1].yPosition,
    problemListTextObject[1].yPosition,
    'problem geometry may differ while native identity is preserved',
  )
  assertEqual(
    countEventCaptureContainers(stableProblemTextObject),
    1,
    'stable problem detail should keep exactly one event capture container',
  )
  assertNoInternalMetadata(stableProblemTextObject)
  assertLogicalMappingMatches(stableProblemTextObject, baseProblemTextObject, 1, 'problemList -> problem')
  assertEqual(
    getTargetContainerIndex(
      stableProblemTextObject[1].containerName,
      stableProblemTextObject[1].containerID,
    ),
    0,
    'stable menu slot should resolve to the logical problem menu index',
  )

  const nextProblemMenuState = {
    ...problemState,
    selectedMenuIndex: 1,
    selectedProblemTab: 'hint',
  } satisfies NavigationState
  const nextStableProblemTextObject = prepareNativeTextObjectsForRebuild(
    problemState,
    stableProblemTextObject,
    nextProblemMenuState,
    createProblemTextObjects(nextProblemMenuState),
  )

  assertSharedNativeIdentitiesMatch(stableProblemTextObject, nextStableProblemTextObject, 'problem -> problem')
  assertIdentityPoolApplied(problemListTextObject, nextStableProblemTextObject, 'problem -> problem')
  recordAcceptedNativeTextObjects(nextStableProblemTextObject)
  assertEqual(
    getTargetContainerIndex(
      nextStableProblemTextObject[1].containerName,
      nextStableProblemTextObject[1].containerID,
    ),
    1,
    'stable menu slot should resolve updated logical problem menu index',
  )

  const indexedState = transitionNavigationToIndex(
    nextProblemMenuState,
    getTargetContainerIndex(
      nextStableProblemTextObject[1].containerName,
      nextStableProblemTextObject[1].containerID,
    ) ?? -1,
    createNavigationContext(nextProblemMenuState),
  )

  assertEqual(indexedState.selectedMenuIndex, 1, 'targeted logical index should keep reducer behavior')

  runProblemDetailSubtreeSequence(
    problemState,
    problemListTextObject,
    stableProblemTextObject,
  )

  const scrolledProblemListState = createProblemListState(7)
  const scrolledProblemListTextObject = createProblemListTextObjects(scrolledProblemListState)
  const differentProblemState = createProblemStateFromList(scrolledProblemListState, 7)
  const differentProblemTextObject = prepareNativeTextObjectsForRebuild(
    scrolledProblemListState,
    scrolledProblemListTextObject,
    differentProblemState,
    createProblemTextObjects(differentProblemState),
  )

  assertSharedNativeIdentitiesMatch(
    scrolledProblemListTextObject,
    differentProblemTextObject,
    'scrolled problemList -> problem',
  )
  assertNoInternalMetadata(differentProblemTextObject)

  resetNativeIdentityForTests()
  runCategoriesNativeIdentityFlow()
  resetNativeIdentityForTests()
  runCollectionsNativeIdentityFlow()
  resetNativeIdentityForTests()
  runFindNativeIdentityFlow()
  resetNativeIdentityForTests()
  runStudyNativeIdentityFlow()
  resetNativeIdentityForTests()
  runSettingsNativeIdentityFlow()
}

function createHomeState(selectedMenuIndex = 0): NavigationState {
  return {
    ...createInitialNavigationState(),
    selectedMenuIndex,
  }
}

function createAcceptedHomeAtIndex(selectedMenuIndex: number): [NavigationState, TextContainerProperty[]] {
  let homeState = createHomeState()
  let homeTextObject = createScreenTextObjects(homeState)

  recordAcceptedNativeTextObjects(homeTextObject)

  for (let index = 0; index < selectedMenuIndex; index += 1) {
    const result = prepareAndAssertRealTransition(
      homeState,
      homeTextObject,
      'down',
      homeTextObject,
    )
    homeState = result[0]
    homeTextObject = result[1]
  }

  assertEqual(homeState.selectedMenuIndex, selectedMenuIndex, 'accepted Home state should reach requested selection')

  return [homeState, homeTextObject]
}

function runCategoriesNativeIdentityFlow(): void {
  const [homeState, homeTextObject] = createAcceptedHomeAtIndex(0)

  const [categoriesState, categoriesTextObject] = prepareAndAssertRealTransition(
    homeState,
    homeTextObject,
    'select',
    homeTextObject,
  )

  assertEqual(categoriesState.currentScreen, 'categories', 'Home -> Categories should reach categories')

  const categorySelectionState = {
    ...categoriesState,
    selectedMenuIndex: 1,
  }
  const [selectedCategoriesState, selectedCategoriesTextObject] = prepareAndAssertDirectState(
    categoriesState,
    categoriesTextObject,
    categorySelectionState,
    categoriesTextObject,
  )

  assertSharedNativeIdentitiesMatch(categoriesTextObject, selectedCategoriesTextObject, 'Categories selection')
  assertEqual(
    getTargetContainerIndex(
      selectedCategoriesTextObject[3].containerName,
      selectedCategoriesTextObject[3].containerID,
    ),
    1,
    'Categories selection should resolve logical item index',
  )

  const [problemListState, problemListTextObject] = prepareAndAssertRealTransition(
    selectedCategoriesState,
    selectedCategoriesTextObject,
    'select',
    selectedCategoriesTextObject,
  )

  assertEqual(problemListState.currentScreen, 'problemList', 'Categories -> category should reach problemList')

  const [problemState, problemTextObject] = prepareAndAssertRealTransition(
    problemListState,
    problemListTextObject,
    'select',
    problemListTextObject,
  )

  assertEqual(problemState.currentScreen, 'problem', 'category problemList -> problem should reach problem')

  const [backToProblemListState, backToProblemListTextObject] = prepareAndAssertRealTransition(
    problemState,
    problemTextObject,
    'back',
    problemListTextObject,
  )

  assertEqual(backToProblemListState.currentScreen, 'problemList', 'problem back should return to category problemList')

  const [backToCategoriesState] = prepareAndAssertRealTransition(
    backToProblemListState,
    backToProblemListTextObject,
    'back',
    problemListTextObject,
  )

  assertEqual(backToCategoriesState.currentScreen, 'categories', 'category problemList back should return to Categories')
}

function runCollectionsNativeIdentityFlow(): void {
  const [homeState, homeTextObject] = createAcceptedHomeAtIndex(2)

  const [collectionsState, collectionsTextObject] = prepareAndAssertRealTransition(
    homeState,
    homeTextObject,
    'select',
    homeTextObject,
  )

  assertEqual(collectionsState.currentScreen, 'collections', 'Home -> Collections should reach collections')

  const [problemListState, problemListTextObject] = prepareAndAssertRealTransition(
    collectionsState,
    collectionsTextObject,
    'select',
    collectionsTextObject,
  )

  assertEqual(problemListState.currentScreen, 'problemList', 'Collections -> collection should reach problemList')

  const [problemState, problemTextObject] = prepareAndAssertRealTransition(
    problemListState,
    problemListTextObject,
    'select',
    problemListTextObject,
  )

  assertEqual(problemState.currentScreen, 'problem', 'collection problemList -> problem should reach problem')

  const [backToProblemListState] = prepareAndAssertRealTransition(
    problemState,
    problemTextObject,
    'back',
    problemListTextObject,
  )

  assertEqual(backToProblemListState.currentScreen, 'problemList', 'problem back should return to collection problemList')
}

function runFindNativeIdentityFlow(): void {
  const [homeState, homeTextObject] = createAcceptedHomeAtIndex(3)

  const [findState, findTextObject] = prepareAndAssertRealTransition(
    homeState,
    homeTextObject,
    'select',
    homeTextObject,
  )

  assertEqual(findState.currentScreen, 'find', 'Home -> Find should reach find')

  const [voiceSearchState, voiceSearchTextObject] = prepareAndAssertRealTransition(
    findState,
    findTextObject,
    'select',
    findTextObject,
  )

  assertEqual(voiceSearchState.currentScreen, 'voiceSearch', 'Find -> Voice Search should reach voiceSearch')

  const [directBackToFindState, directBackToFindTextObject] = prepareAndAssertRealTransition(
    voiceSearchState,
    voiceSearchTextObject,
    'back',
    findTextObject,
  )

  assertEqual(directBackToFindState.currentScreen, 'find', 'Voice Search back should return to Find')

  const [voiceSearchAgainState, voiceSearchAgainTextObject] = prepareAndAssertRealTransition(
    directBackToFindState,
    directBackToFindTextObject,
    'select',
    directBackToFindTextObject,
  )

  assertEqual(voiceSearchAgainState.currentScreen, 'voiceSearch', 'Find should reopen Voice Search')

  const listeningVoiceState = {
    ...voiceSearchAgainState,
    voiceSearchStatus: 'listening',
    voiceTranscript: 'two sum',
  } satisfies NavigationState
  const [listeningState, listeningTextObject] = prepareAndAssertDirectState(
    voiceSearchAgainState,
    voiceSearchAgainTextObject,
    listeningVoiceState,
    findTextObject,
  )

  const processingVoiceState = {
    ...listeningState,
    voiceSearchStatus: 'processing',
  } satisfies NavigationState
  const [processingState, processingTextObject] = prepareAndAssertDirectState(
    listeningState,
    listeningTextObject,
    processingVoiceState,
    findTextObject,
  )

  const exactMatchState = {
    ...processingState,
    currentScreen: 'voiceMatch',
    voiceSearchStatus: 'idle',
    voiceTranscript: 'two sum',
    voiceResultMode: 'exact',
    voiceResultProblemIds: [1],
    selectedMenuIndex: 0,
  } satisfies NavigationState
  const [exactVoiceMatchState, exactVoiceMatchTextObject] = prepareAndAssertDirectState(
    processingState,
    processingTextObject,
    exactMatchState,
    findTextObject,
  )

  assertEqual(exactVoiceMatchState.currentScreen, 'voiceMatch', 'Voice exact match should reach voiceMatch')

  const [voiceMatchProblemState, voiceMatchProblemTextObject] = prepareAndAssertRealTransition(
    exactVoiceMatchState,
    exactVoiceMatchTextObject,
    'select',
    exactVoiceMatchTextObject,
  )

  assertEqual(voiceMatchProblemState.currentScreen, 'problem', 'Voice exact match should open problem')

  const [backToExactMatchState] = prepareAndAssertRealTransition(
    voiceMatchProblemState,
    voiceMatchProblemTextObject,
    'back',
    exactVoiceMatchTextObject,
  )

  assertEqual(backToExactMatchState.currentScreen, 'voiceMatch', 'Voice problem back should return to exact match')

  const voiceResultsState = {
    ...processingState,
    currentScreen: 'voiceResults',
    voiceSearchStatus: 'idle',
    voiceTranscript: 'sum',
    voiceResultMode: 'possible',
    voiceResultProblemIds: [1, 15, 49, 53, 121],
    selectedMenuIndex: 0,
  } satisfies NavigationState
  const [possibleVoiceResultsState, possibleVoiceResultsTextObject] = prepareAndAssertDirectState(
    processingState,
    processingTextObject,
    voiceResultsState,
    findTextObject,
  )

  assertEqual(possibleVoiceResultsState.currentScreen, 'voiceResults', 'Voice possible matches should reach voiceResults')

  const [voiceResultsProblemState] = prepareAndAssertRealTransition(
    possibleVoiceResultsState,
    possibleVoiceResultsTextObject,
    'select',
    possibleVoiceResultsTextObject,
  )

  assertEqual(voiceResultsProblemState.currentScreen, 'problem', 'Voice result selection should open problem')

  const noMatchState = {
    ...processingState,
    currentScreen: 'voiceMatch',
    voiceSearchStatus: 'idle',
    voiceTranscript: 'zzzz',
    voiceResultMode: 'none',
    voiceResultProblemIds: [],
  } satisfies NavigationState
  const [voiceMatchState, voiceMatchTextObject] = prepareAndAssertDirectState(
    processingState,
    processingTextObject,
    noMatchState,
    findTextObject,
  )

  assertEqual(voiceMatchState.currentScreen, 'voiceMatch', 'Voice flow should reach voiceMatch')

  const [backToVoiceSearchState, backToVoiceSearchTextObject] = prepareAndAssertRealTransition(
    voiceMatchState,
    voiceMatchTextObject,
    'back',
    findTextObject,
  )

  assertEqual(backToVoiceSearchState.currentScreen, 'find', 'No-match voice result back should return to Find')

  const difficultyFindState = {
    ...backToVoiceSearchState,
    currentScreen: 'find',
    selectedMenuIndex: 2,
  } satisfies NavigationState
  const [selectedFindState, selectedFindTextObject] = prepareAndAssertDirectState(
    backToVoiceSearchState,
    backToVoiceSearchTextObject,
    difficultyFindState,
    findTextObject,
  )

  assertEqual(
    getTargetContainerIndex(
      selectedFindTextObject[4].containerName,
      selectedFindTextObject[4].containerID,
    ),
    2,
    'Find difficulty row should resolve logical item index',
  )

  const [difficultyState, difficultyTextObject] = prepareAndAssertRealTransition(
    selectedFindState,
    selectedFindTextObject,
    'select',
    selectedFindTextObject,
  )

  assertEqual(difficultyState.currentScreen, 'difficultyList', 'Find -> By Difficulty should reach difficultyList')

  const [difficultyProblemListState, difficultyProblemListTextObject] = prepareAndAssertRealTransition(
    difficultyState,
    difficultyTextObject,
    'select',
    difficultyTextObject,
  )

  assertEqual(difficultyProblemListState.currentScreen, 'problemList', 'Difficulty -> problemList should reach problemList')

  const [problemState] = prepareAndAssertRealTransition(
    difficultyProblemListState,
    difficultyProblemListTextObject,
    'select',
    difficultyProblemListTextObject,
  )

  assertEqual(problemState.currentScreen, 'problem', 'difficulty problemList -> problem should reach problem')
}

function runStudyNativeIdentityFlow(): void {
  const [homeState, homeTextObject] = createAcceptedHomeAtIndex(4)

  const [studyState, studyTextObject] = prepareAndAssertRealTransition(
    homeState,
    homeTextObject,
    'select',
    homeTextObject,
  )

  assertEqual(studyState.currentScreen, 'study', 'Home -> Study should reach study')

  const [randomQuestionState, randomQuestionTextObject] = prepareAndAssertRealTransition(
    studyState,
    studyTextObject,
    'select',
    studyTextObject,
  )

  assertEqual(randomQuestionState.currentScreen, 'studyQuestion', 'Study -> Random Problem should reach studyQuestion')

  const [backToStudyState, backToStudyTextObject] = prepareAndAssertRealTransition(
    randomQuestionState,
    randomQuestionTextObject,
    'back',
    studyTextObject,
  )

  assertEqual(backToStudyState.currentScreen, 'study', 'Random Problem back should return to study')

  const byPatternStudyState = {
    ...backToStudyState,
    selectedMenuIndex: 1,
  } satisfies NavigationState
  const [selectedStudyState, selectedStudyTextObject] = prepareAndAssertDirectState(
    backToStudyState,
    backToStudyTextObject,
    byPatternStudyState,
    studyTextObject,
  )

  const [studyPatternState, studyPatternTextObject] = prepareAndAssertRealTransition(
    selectedStudyState,
    selectedStudyTextObject,
    'select',
    selectedStudyTextObject,
  )

  assertEqual(studyPatternState.currentScreen, 'studyPattern', 'Study -> By Pattern should reach studyPattern')

  const [patternQuestionState, patternQuestionTextObject] = prepareAndAssertRealTransition(
    studyPatternState,
    studyPatternTextObject,
    'select',
    studyPatternTextObject,
  )

  assertEqual(patternQuestionState.currentScreen, 'studyQuestion', 'Study pattern selection should reach studyQuestion')

  const [backToPatternState, backToPatternTextObject] = prepareAndAssertRealTransition(
    patternQuestionState,
    patternQuestionTextObject,
    'back',
    studyPatternTextObject,
  )

  assertEqual(backToPatternState.currentScreen, 'studyPattern', 'Pattern question back should return to studyPattern')

  const [backToStudyAgainState, backToStudyAgainTextObject] = prepareAndAssertRealTransition(
    backToPatternState,
    backToPatternTextObject,
    'back',
    studyTextObject,
  )

  assertEqual(backToStudyAgainState.currentScreen, 'study', 'Study pattern back should return to study')

  const blind75StudyState = {
    ...backToStudyAgainState,
    selectedMenuIndex: 2,
  } satisfies NavigationState
  const [blind75SelectedStudyState, blind75SelectedStudyTextObject] = prepareAndAssertDirectState(
    backToStudyAgainState,
    backToStudyAgainTextObject,
    blind75StudyState,
    studyTextObject,
  )

  const [blind75QuestionState] = prepareAndAssertRealTransition(
    blind75SelectedStudyState,
    blind75SelectedStudyTextObject,
    'select',
    blind75SelectedStudyTextObject,
  )

  assertEqual(blind75QuestionState.currentScreen, 'studyQuestion', 'Study -> Blind 75 should reach studyQuestion')
}

function runSettingsNativeIdentityFlow(): void {
  const [homeState, homeTextObject] = createAcceptedHomeAtIndex(7)

  const [settingsState, settingsTextObject] = prepareAndAssertRealTransition(
    homeState,
    homeTextObject,
    'select',
    homeTextObject,
  )

  assertEqual(settingsState.currentScreen, 'settings', 'Home -> Settings should reach settings')

  const [languageState, languageTextObject] = prepareAndAssertRealTransition(
    settingsState,
    settingsTextObject,
    'select',
    settingsTextObject,
  )

  assertEqual(languageState.currentScreen, 'language', 'Settings -> Language should reach language')

  const languageSelectionState = {
    ...languageState,
    selectedMenuIndex: 1,
  } satisfies NavigationState
  const [selectedLanguageState, selectedLanguageTextObject] = prepareAndAssertDirectState(
    languageState,
    languageTextObject,
    languageSelectionState,
    settingsTextObject,
  )

  assertSharedNativeIdentitiesMatch(languageTextObject, selectedLanguageTextObject, 'Language selection')

  const [backToSettingsState, backToSettingsTextObject] = prepareAndAssertRealTransition(
    selectedLanguageState,
    selectedLanguageTextObject,
    'back',
    settingsTextObject,
  )

  assertEqual(backToSettingsState.currentScreen, 'settings', 'Language back should return to settings')

  const [backToHomeState] = prepareAndAssertRealTransition(
    backToSettingsState,
    backToSettingsTextObject,
    'back',
    homeTextObject,
  )

  assertEqual(backToHomeState.currentScreen, 'home', 'Settings back should return home')
}
