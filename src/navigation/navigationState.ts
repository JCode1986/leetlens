import { FIND_MENU_ITEMS, HOME_MENU_ITEMS, PROBLEM_TABS, SETTINGS_MENU_ITEMS } from '../types/navigation'
import type { NavigationState, ProblemListSource, ProblemTab } from '../types/navigation'
import { DIFFICULTIES } from '../types/problem'
import type { Problem, ProblemId } from '../types/problem'
import type { SearchDecision } from '../services/searchService'
import {
  getSelectableLanguageIndex,
  SELECTABLE_PROGRAMMING_LANGUAGES,
} from '../utils/language'
import type { SelectableProgrammingLanguage } from '../utils/language'

export type NavigationInput = 'up' | 'down' | 'select' | 'back'

export interface NavigationContext {
  categories: string[]
  patterns: string[]
  collections: string[]
  problemListProblems: Problem[]
  voiceResultProblems: Problem[]
  pageCount: number
}

export function createInitialNavigationState(
  selectedLanguage: SelectableProgrammingLanguage = 'javascript',
): NavigationState {
  return {
    currentScreen: 'home',
    selectedMenuIndex: 0,
    selectedCategory: undefined,
    selectedPattern: undefined,
    selectedCollection: undefined,
    selectedDifficulty: undefined,
    problemListSource: undefined,
    selectedProblemId: undefined,
    problemEntrySource: undefined,
    selectedLanguage,
    selectedProblemTab: 'hint',
    codePageIndex: 0,
    voiceSearchStatus: 'idle',
    voiceTranscript: '',
    voiceError: undefined,
    voiceResultMode: undefined,
    voiceResultProblemIds: [],
  }
}

export function clampIndex(index: number, itemCount: number): number {
  return Math.max(0, Math.min(Math.max(0, itemCount - 1), index))
}

export function setSelectedMenuIndex(
  state: NavigationState,
  selectedMenuIndex: number,
  itemCount: number = HOME_MENU_ITEMS.length,
): NavigationState {
  return {
    ...state,
    selectedMenuIndex: clampIndex(selectedMenuIndex, itemCount),
  }
}

export function clampHomeMenuIndex(index: number): number {
  return clampIndex(index, HOME_MENU_ITEMS.length)
}

function moveSelectedMenu(
  state: NavigationState,
  delta: number,
  itemCount: number,
): NavigationState {
  return setSelectedMenuIndex(state, state.selectedMenuIndex + delta, itemCount)
}

function movePage(state: NavigationState, delta: number, pageCount: number): NavigationState {
  return {
    ...state,
    codePageIndex: clampIndex(state.codePageIndex + delta, pageCount),
  }
}

function problemTabFromIndex(index: number): ProblemTab {
  return PROBLEM_TABS[clampIndex(index, PROBLEM_TABS.length)].screen
}

function problemTabIndex(tab: ProblemTab): number {
  return Math.max(0, PROBLEM_TABS.findIndex((candidate) => candidate.screen === tab))
}

function getHomeMenuIndex(screen: NavigationState['currentScreen']): number {
  return Math.max(0, HOME_MENU_ITEMS.findIndex((candidate) => candidate.screen === screen))
}

function getFindMenuIndex(screen: NavigationState['currentScreen']): number {
  return Math.max(0, FIND_MENU_ITEMS.findIndex((candidate) => candidate.screen === screen))
}

function getStringIndex(items: string[], selectedItem: string | undefined): number {
  if (!selectedItem) {
    return 0
  }

  return clampIndex(items.indexOf(selectedItem), items.length)
}

function getProblemIndex(
  problems: Problem[],
  selectedProblemId: ProblemId | undefined,
): number {
  if (selectedProblemId === undefined) {
    return 0
  }

  return clampIndex(
    problems.findIndex((problem) => problem.id === selectedProblemId),
    problems.length,
  )
}

function getSourceScreen(source: ProblemListSource | undefined): NavigationState['currentScreen'] {
  if (source === 'all') {
    return 'find'
  }

  if (source === 'difficulty') {
    return 'difficultyList'
  }

  if (source === 'pattern') {
    return 'patterns'
  }

  if (source === 'collection') {
    return 'collections'
  }

  return 'categories'
}

function getSourceIndex(state: NavigationState, context: NavigationContext): number {
  if (state.problemListSource === 'all') {
    return getFindMenuIndex('problemList')
  }

  if (state.problemListSource === 'pattern') {
    return getStringIndex(context.patterns, state.selectedPattern)
  }

  if (state.problemListSource === 'collection') {
    return getStringIndex(context.collections, state.selectedCollection)
  }

  if (state.problemListSource === 'difficulty') {
    return getStringIndex([...DIFFICULTIES], state.selectedDifficulty)
  }

  return getStringIndex(context.categories, state.selectedCategory)
}

function selectCurrentItem(
  state: NavigationState,
  context: NavigationContext,
): NavigationState {
  if (state.currentScreen === 'home') {
    const selectedItem = HOME_MENU_ITEMS[clampHomeMenuIndex(state.selectedMenuIndex)]

    if (
      selectedItem.screen !== 'categories' &&
      selectedItem.screen !== 'patterns' &&
      selectedItem.screen !== 'collections' &&
      selectedItem.screen !== 'find' &&
      selectedItem.screen !== 'settings'
    ) {
      return state
    }

    return {
      ...state,
      currentScreen: selectedItem.screen,
      selectedMenuIndex: selectedItem.screen === 'categories'
        ? getStringIndex(context.categories, state.selectedCategory)
        : selectedItem.screen === 'patterns'
          ? getStringIndex(context.patterns, state.selectedPattern)
          : selectedItem.screen === 'collections'
            ? getStringIndex(context.collections, state.selectedCollection)
            : selectedItem.screen === 'find'
              ? 0
            : 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'find') {
    const selectedItem = FIND_MENU_ITEMS[clampIndex(
      state.selectedMenuIndex,
      FIND_MENU_ITEMS.length,
    )]

    if (!selectedItem) {
      return state
    }

    if (selectedItem.screen === 'problemList') {
      return {
        ...state,
        currentScreen: 'problemList',
        problemListSource: 'all',
        selectedMenuIndex: 0,
        codePageIndex: 0,
      }
    }

    return {
      ...state,
      currentScreen: selectedItem.screen,
      selectedMenuIndex: 0,
      codePageIndex: 0,
      voiceSearchStatus: selectedItem.screen === 'voiceSearch' ? 'idle' : state.voiceSearchStatus,
      voiceError: selectedItem.screen === 'voiceSearch' ? undefined : state.voiceError,
    }
  }

  if (state.currentScreen === 'settings') {
    const selectedItem = SETTINGS_MENU_ITEMS[clampIndex(
      state.selectedMenuIndex,
      SETTINGS_MENU_ITEMS.length,
    )]

    if (!selectedItem) {
      return state
    }

    return {
      ...state,
      currentScreen: selectedItem.screen,
      selectedMenuIndex: getSelectableLanguageIndex(state.selectedLanguage),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'language') {
    const selectedLanguage = SELECTABLE_PROGRAMMING_LANGUAGES[clampIndex(
      state.selectedMenuIndex,
      SELECTABLE_PROGRAMMING_LANGUAGES.length,
    )]

    if (!selectedLanguage) {
      return state
    }

    return {
      ...state,
      selectedLanguage,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'difficultyList') {
    const selectedDifficulty = DIFFICULTIES[clampIndex(
      state.selectedMenuIndex,
      DIFFICULTIES.length,
    )]

    if (!selectedDifficulty) {
      return state
    }

    return {
      ...state,
      currentScreen: 'problemList',
      selectedDifficulty,
      problemListSource: 'difficulty',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'categories') {
    const selectedCategory = context.categories[clampIndex(
      state.selectedMenuIndex,
      context.categories.length,
    )]

    if (!selectedCategory) {
      return state
    }

    return {
      ...state,
      currentScreen: 'problemList',
      selectedCategory,
      problemListSource: 'category',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'patterns') {
    const selectedPattern = context.patterns[clampIndex(
      state.selectedMenuIndex,
      context.patterns.length,
    )]

    if (!selectedPattern) {
      return state
    }

    return {
      ...state,
      currentScreen: 'problemList',
      selectedPattern,
      problemListSource: 'pattern',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'collections') {
    const selectedCollection = context.collections[clampIndex(
      state.selectedMenuIndex,
      context.collections.length,
    )]

    if (!selectedCollection) {
      return state
    }

    return {
      ...state,
      currentScreen: 'problemList',
      selectedCollection,
      problemListSource: 'collection',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problemList') {
    const selectedProblem = context.problemListProblems[clampIndex(
      state.selectedMenuIndex,
      context.problemListProblems.length,
    )]

    if (!selectedProblem) {
      return state
    }

    return {
      ...state,
      currentScreen: 'problem',
      selectedProblemId: selectedProblem.id,
      problemEntrySource: 'problemList',
      selectedProblemTab: 'hint',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'voiceMatch') {
    if (state.voiceResultMode === 'exact' && state.selectedMenuIndex === 0) {
      const matchedProblem = context.voiceResultProblems[0]

      if (!matchedProblem) {
        return state
      }

      return {
        ...state,
        currentScreen: 'problem',
        selectedProblemId: matchedProblem.id,
        problemEntrySource: 'voiceMatch',
        selectedProblemTab: 'hint',
        selectedMenuIndex: 0,
        codePageIndex: 0,
      }
    }

    return {
      ...state,
      currentScreen: 'voiceSearch',
      selectedMenuIndex: 0,
      codePageIndex: 0,
      voiceSearchStatus: 'idle',
      voiceError: undefined,
    }
  }

  if (state.currentScreen === 'voiceResults') {
    const selectedProblem = context.voiceResultProblems[clampIndex(
      state.selectedMenuIndex,
      context.voiceResultProblems.length,
    )]

    if (!selectedProblem) {
      return state
    }

    return {
      ...state,
      currentScreen: 'problem',
      selectedProblemId: selectedProblem.id,
      problemEntrySource: 'voiceResults',
      selectedProblemTab: 'hint',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problem') {
    const selectedProblemTab = problemTabFromIndex(state.selectedMenuIndex)

    return {
      ...state,
      currentScreen: selectedProblemTab,
      selectedProblemTab,
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  return state
}

function goBack(state: NavigationState, context: NavigationContext): NavigationState {
  if (state.currentScreen === 'categories') {
    return {
      ...state,
      currentScreen: 'home',
      selectedMenuIndex: getHomeMenuIndex('categories'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'patterns') {
    return {
      ...state,
      currentScreen: 'home',
      selectedMenuIndex: getHomeMenuIndex('patterns'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'collections') {
    return {
      ...state,
      currentScreen: 'home',
      selectedMenuIndex: getHomeMenuIndex('collections'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'find') {
    return {
      ...state,
      currentScreen: 'home',
      selectedMenuIndex: getHomeMenuIndex('find'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'voiceSearch') {
    return {
      ...state,
      currentScreen: 'find',
      selectedMenuIndex: getFindMenuIndex('voiceSearch'),
      codePageIndex: 0,
      voiceSearchStatus: 'idle',
      voiceError: undefined,
    }
  }

  if (state.currentScreen === 'voiceMatch') {
    return {
      ...state,
      currentScreen: state.voiceResultMode === 'none' ? 'find' : 'voiceSearch',
      selectedMenuIndex: state.voiceResultMode === 'none' ? getFindMenuIndex('voiceSearch') : 0,
      codePageIndex: 0,
      voiceSearchStatus: 'idle',
      voiceError: undefined,
    }
  }

  if (state.currentScreen === 'voiceResults') {
    return {
      ...state,
      currentScreen: 'voiceSearch',
      selectedMenuIndex: 0,
      codePageIndex: 0,
      voiceSearchStatus: 'idle',
      voiceError: undefined,
    }
  }

  if (state.currentScreen === 'difficultyList') {
    return {
      ...state,
      currentScreen: 'find',
      selectedMenuIndex: getFindMenuIndex('difficultyList'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'settings') {
    return {
      ...state,
      currentScreen: 'home',
      selectedMenuIndex: getHomeMenuIndex('settings'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'language') {
    return {
      ...state,
      currentScreen: 'settings',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problemList') {
    return {
      ...state,
      currentScreen: getSourceScreen(state.problemListSource),
      selectedMenuIndex: getSourceIndex(state, context),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problem') {
    if (state.problemEntrySource === 'voiceMatch') {
      return {
        ...state,
        currentScreen: 'voiceMatch',
        selectedMenuIndex: 0,
        codePageIndex: 0,
      }
    }

    if (state.problemEntrySource === 'voiceResults') {
      return {
        ...state,
        currentScreen: 'voiceResults',
        selectedMenuIndex: getProblemIndex(context.voiceResultProblems, state.selectedProblemId),
        codePageIndex: 0,
      }
    }

    return {
      ...state,
      currentScreen: 'problemList',
      selectedMenuIndex: getProblemIndex(context.problemListProblems, state.selectedProblemId),
      codePageIndex: 0,
    }
  }

  if (
    state.currentScreen === 'hint' ||
    state.currentScreen === 'approach' ||
    state.currentScreen === 'solution' ||
    state.currentScreen === 'edgeCases'
  ) {
    return {
      ...state,
      currentScreen: 'problem',
      selectedMenuIndex: problemTabIndex(state.selectedProblemTab),
      codePageIndex: 0,
    }
  }

  return state
}

export function transitionNavigation(
  state: NavigationState,
  input: NavigationInput,
  context: NavigationContext,
): NavigationState {
  if (input === 'back') {
    return goBack(state, context)
  }

  if (input === 'select') {
    return selectCurrentItem(state, context)
  }

  const delta = input === 'up' ? -1 : 1

  if (state.currentScreen === 'home') {
    return moveSelectedMenu(state, delta, HOME_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'categories') {
    return moveSelectedMenu(state, delta, context.categories.length)
  }

  if (state.currentScreen === 'find') {
    return moveSelectedMenu(state, delta, FIND_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'patterns') {
    return moveSelectedMenu(state, delta, context.patterns.length)
  }

  if (state.currentScreen === 'collections') {
    return moveSelectedMenu(state, delta, context.collections.length)
  }

  if (state.currentScreen === 'settings') {
    return moveSelectedMenu(state, delta, SETTINGS_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'language') {
    return moveSelectedMenu(state, delta, SELECTABLE_PROGRAMMING_LANGUAGES.length)
  }

  if (state.currentScreen === 'difficultyList') {
    return moveSelectedMenu(state, delta, DIFFICULTIES.length)
  }

  if (state.currentScreen === 'problemList') {
    return moveSelectedMenu(state, delta, context.problemListProblems.length)
  }

  if (state.currentScreen === 'voiceMatch') {
    return moveSelectedMenu(state, delta, state.voiceResultMode === 'exact' ? 2 : 1)
  }

  if (state.currentScreen === 'voiceResults') {
    return moveSelectedMenu(state, delta, context.voiceResultProblems.length)
  }

  if (state.currentScreen === 'problem') {
    const nextIndex = clampIndex(state.selectedMenuIndex + delta, PROBLEM_TABS.length)

    return {
      ...state,
      selectedMenuIndex: nextIndex,
      selectedProblemTab: problemTabFromIndex(nextIndex),
    }
  }

  if (
    state.currentScreen === 'hint' ||
    state.currentScreen === 'approach' ||
    state.currentScreen === 'solution' ||
    state.currentScreen === 'edgeCases'
  ) {
    return movePage(state, delta, context.pageCount)
  }

  return state
}

export function beginVoiceListening(state: NavigationState): NavigationState {
  return {
    ...state,
    currentScreen: 'voiceSearch',
    selectedMenuIndex: 0,
    codePageIndex: 0,
    voiceSearchStatus: 'listening',
    voiceTranscript: '',
    voiceError: undefined,
    voiceResultMode: undefined,
    voiceResultProblemIds: [],
  }
}

export function setVoiceProcessing(state: NavigationState): NavigationState {
  return {
    ...state,
    currentScreen: 'voiceSearch',
    selectedMenuIndex: 0,
    codePageIndex: 0,
    voiceSearchStatus: 'processing',
  }
}

export function setVoiceTranscript(state: NavigationState, transcript: string): NavigationState {
  return {
    ...state,
    currentScreen: 'voiceSearch',
    selectedMenuIndex: 0,
    voiceTranscript: transcript,
  }
}

export function setVoiceError(state: NavigationState, message: string): NavigationState {
  return {
    ...state,
    currentScreen: 'voiceSearch',
    selectedMenuIndex: 0,
    codePageIndex: 0,
    voiceSearchStatus: 'error',
    voiceError: message,
  }
}

export function applyVoiceSearchDecision(
  state: NavigationState,
  decision: SearchDecision,
): NavigationState {
  if (decision.kind === 'empty') {
    return setVoiceError(state, 'No speech heard.')
  }

  if (decision.kind === 'none') {
    return {
      ...state,
      currentScreen: 'voiceMatch',
      selectedMenuIndex: 0,
      codePageIndex: 0,
      voiceSearchStatus: 'idle',
      voiceTranscript: decision.query,
      voiceError: undefined,
      voiceResultMode: 'none',
      voiceResultProblemIds: [],
    }
  }

  const voiceResultProblemIds = decision.matches.map((match) => match.problem.id)

  return {
    ...state,
    currentScreen: decision.kind === 'exact' ? 'voiceMatch' : 'voiceResults',
    selectedMenuIndex: 0,
    codePageIndex: 0,
    voiceSearchStatus: 'idle',
    voiceTranscript: decision.query,
    voiceError: undefined,
    voiceResultMode: decision.kind,
    voiceResultProblemIds,
  }
}
