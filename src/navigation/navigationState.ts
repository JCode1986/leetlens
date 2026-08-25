import { HOME_MENU_ITEMS, PROBLEM_TABS, SETTINGS_MENU_ITEMS } from '../types/navigation'
import type { NavigationState, ProblemListSource, ProblemTab } from '../types/navigation'
import type { Problem, ProblemId } from '../types/problem'
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
    problemListSource: undefined,
    selectedProblemId: undefined,
    selectedLanguage,
    selectedProblemTab: 'hint',
    codePageIndex: 0,
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
  if (source === 'pattern') {
    return 'patterns'
  }

  if (source === 'collection') {
    return 'collections'
  }

  return 'categories'
}

function getSourceIndex(state: NavigationState, context: NavigationContext): number {
  if (state.problemListSource === 'pattern') {
    return getStringIndex(context.patterns, state.selectedPattern)
  }

  if (state.problemListSource === 'collection') {
    return getStringIndex(context.collections, state.selectedCollection)
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
            : 0,
      codePageIndex: 0,
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

  if (state.currentScreen === 'problemList') {
    return moveSelectedMenu(state, delta, context.problemListProblems.length)
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
