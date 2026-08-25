import { HOME_MENU_ITEMS, PROBLEM_TABS } from '../types/navigation'
import type { NavigationState, ProblemTab } from '../types/navigation'
import type { Problem, ProblemId } from '../types/problem'

export type NavigationInput = 'up' | 'down' | 'select' | 'back'

export interface NavigationContext {
  categories: string[]
  categoryProblems: Problem[]
  pageCount: number
}

export function createInitialNavigationState(): NavigationState {
  return {
    currentScreen: 'home',
    selectedMenuIndex: 0,
    selectedCategory: undefined,
    selectedProblemId: undefined,
    selectedLanguage: 'javascript',
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

function getCategoryIndex(categories: string[], selectedCategory: string | undefined): number {
  if (!selectedCategory) {
    return 0
  }

  return clampIndex(categories.indexOf(selectedCategory), categories.length)
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

function selectCurrentItem(
  state: NavigationState,
  context: NavigationContext,
): NavigationState {
  if (state.currentScreen === 'home') {
    const selectedItem = HOME_MENU_ITEMS[clampHomeMenuIndex(state.selectedMenuIndex)]

    if (selectedItem.screen !== 'categories') {
      return state
    }

    return {
      ...state,
      currentScreen: 'categories',
      selectedMenuIndex: getCategoryIndex(context.categories, state.selectedCategory),
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
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problemList') {
    const selectedProblem = context.categoryProblems[clampIndex(
      state.selectedMenuIndex,
      context.categoryProblems.length,
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
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problemList') {
    return {
      ...state,
      currentScreen: 'categories',
      selectedMenuIndex: getCategoryIndex(context.categories, state.selectedCategory),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problem') {
    return {
      ...state,
      currentScreen: 'problemList',
      selectedMenuIndex: getProblemIndex(context.categoryProblems, state.selectedProblemId),
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

  if (state.currentScreen === 'problemList') {
    return moveSelectedMenu(state, delta, context.categoryProblems.length)
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
