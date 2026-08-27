import {
  FIND_MENU_ITEMS,
  HOME_MENU_ITEMS,
  PROBLEM_FAVORITE_MENU_INDEX,
  PROBLEM_MENU_ITEM_COUNT,
  PROBLEM_TABS,
  SETTINGS_MENU_ITEMS,
  STUDY_MENU_ITEMS,
} from '../types/navigation'
import type { NavigationState, ProblemListSource, ProblemTab, StudySource } from '../types/navigation'
import { DIFFICULTIES } from '../types/problem'
import type { Problem, ProblemId } from '../types/problem'
import type { SearchDecision } from '../services/searchService'
import { createStudyQuestion, pushStudyRecentProblemId } from '../services/studyService'
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
    selectedProblemTab: 'quickAnswer',
    codePageIndex: 0,
    voiceSearchStatus: 'idle',
    voiceTranscript: '',
    voiceError: undefined,
    voiceResultMode: undefined,
    voiceResultProblemIds: [],
    studySource: undefined,
    studyPattern: undefined,
    studyProblemId: undefined,
    studyQuestionType: undefined,
    studyChoices: [],
    studySelectedIndex: 0,
    studyAnswered: false,
    studyCorrect: undefined,
    studyRecentProblemIds: [],
  }
}

function clampIndex(index: number, itemCount: number): number {
  return Math.max(0, Math.min(Math.max(0, itemCount - 1), index))
}

function setSelectedMenuIndex(
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

function setProblemMenuIndex(state: NavigationState, index: number): NavigationState {
  const nextIndex = clampIndex(index, PROBLEM_MENU_ITEM_COUNT)

  return {
    ...state,
    selectedMenuIndex: nextIndex,
    selectedProblemTab: nextIndex === PROBLEM_FAVORITE_MENU_INDEX
      ? state.selectedProblemTab
      : problemTabFromIndex(nextIndex),
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

function getStudyMenuIndex(source: StudySource | undefined): number {
  return Math.max(0, STUDY_MENU_ITEMS.findIndex((candidate) => candidate.source === source))
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

function getStudyFeedbackActionCount(state: NavigationState): number {
  return state.studyCorrect ? 4 : 3
}

function beginStudyQuestion(
  state: NavigationState,
  source: StudySource,
  pattern?: string,
): NavigationState {
  const question = createStudyQuestion({
    source,
    pattern,
    recentProblemIds: state.studyRecentProblemIds,
  })

  if (!question) {
    return {
      ...state,
      currentScreen: source === 'pattern' ? 'studyPattern' : 'study',
      studySource: source,
      studyPattern: pattern,
      studyProblemId: undefined,
      studyQuestionType: undefined,
      studyChoices: [],
      studySelectedIndex: 0,
      studyAnswered: false,
      studyCorrect: undefined,
      codePageIndex: 0,
    }
  }

  return {
    ...state,
    currentScreen: 'studyQuestion',
    selectedProblemId: question.problem.id,
    problemEntrySource: 'study',
    selectedProblemTab: 'quickAnswer',
    studySource: source,
    studyPattern: pattern,
    studyProblemId: question.problem.id,
    studyQuestionType: question.questionType,
    studyChoices: question.choices,
    studySelectedIndex: 0,
    studyAnswered: false,
    studyCorrect: undefined,
    studyRecentProblemIds: pushStudyRecentProblemId(
      state.studyRecentProblemIds,
      question.problem.id,
    ),
    codePageIndex: 0,
  }
}

function getSourceScreen(source: ProblemListSource | undefined): NavigationState['currentScreen'] {
  if (source === 'favorites' || source === 'recent') {
    return 'home'
  }

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

  if (state.problemListSource === 'favorites') {
    return getHomeMenuIndex('favorites')
  }

  if (state.problemListSource === 'recent') {
    return getHomeMenuIndex('recent')
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
      selectedItem.screen !== 'study' &&
      selectedItem.screen !== 'favorites' &&
      selectedItem.screen !== 'recent' &&
      selectedItem.screen !== 'settings'
    ) {
      return state
    }

    if (selectedItem.screen === 'favorites' || selectedItem.screen === 'recent') {
      return {
        ...state,
        currentScreen: 'problemList',
        problemListSource: selectedItem.screen,
        selectedMenuIndex: 0,
        codePageIndex: 0,
      }
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
              : selectedItem.screen === 'study'
                ? 0
            : 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'study') {
    const selectedItem = STUDY_MENU_ITEMS[clampIndex(
      state.selectedMenuIndex,
      STUDY_MENU_ITEMS.length,
    )]

    if (!selectedItem) {
      return state
    }

    if (selectedItem.source === 'pattern') {
      return {
        ...state,
        currentScreen: 'studyPattern',
        selectedMenuIndex: getStringIndex(context.patterns, state.studyPattern),
        studySource: 'pattern',
        codePageIndex: 0,
      }
    }

    return beginStudyQuestion(state, selectedItem.source)
  }

  if (state.currentScreen === 'studyPattern') {
    const selectedPattern = context.patterns[clampIndex(
      state.selectedMenuIndex,
      context.patterns.length,
    )]

    if (!selectedPattern) {
      return state
    }

    return beginStudyQuestion(state, 'pattern', selectedPattern)
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
      selectedProblemTab: 'quickAnswer',
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
        selectedProblemTab: 'quickAnswer',
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
      selectedProblemTab: 'quickAnswer',
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'problem') {
    if (state.selectedMenuIndex === PROBLEM_FAVORITE_MENU_INDEX) {
      return state
    }

    const selectedProblemTab = problemTabFromIndex(state.selectedMenuIndex)

    return {
      ...state,
      currentScreen: selectedProblemTab,
      selectedProblemTab,
      selectedMenuIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'studyQuestion') {
    const selectedChoice = state.studyChoices[clampIndex(
      state.studySelectedIndex,
      state.studyChoices.length,
    )]

    if (!selectedChoice) {
      return state
    }

    return {
      ...state,
      currentScreen: 'studyFeedback',
      studyAnswered: true,
      studyCorrect: selectedChoice.isCorrect,
      studySelectedIndex: 0,
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'studyFeedback') {
    const actionIndex = clampIndex(state.studySelectedIndex, getStudyFeedbackActionCount(state))

    if (state.studyCorrect) {
      if (actionIndex === 0) {
        return {
          ...state,
          currentScreen: 'quickAnswer',
          selectedProblemId: state.studyProblemId,
          problemEntrySource: 'study',
          selectedProblemTab: 'quickAnswer',
          codePageIndex: 0,
        }
      }

      if (actionIndex === 1) {
        return {
          ...state,
          currentScreen: 'pseudocode',
          selectedProblemId: state.studyProblemId,
          problemEntrySource: 'study',
          selectedProblemTab: 'pseudocode',
          codePageIndex: 0,
        }
      }

      if (actionIndex === 2) {
        return {
          ...state,
          currentScreen: 'solution',
          selectedProblemId: state.studyProblemId,
          problemEntrySource: 'study',
          selectedProblemTab: 'solution',
          codePageIndex: 0,
        }
      }

      return beginStudyQuestion(state, state.studySource ?? 'random', state.studyPattern)
    }

    if (actionIndex === 0) {
      return {
        ...state,
        currentScreen: 'approach',
        selectedProblemId: state.studyProblemId,
        problemEntrySource: 'study',
        selectedProblemTab: 'approach',
        codePageIndex: 0,
      }
    }

    if (actionIndex === 1) {
      return {
        ...state,
        currentScreen: 'quickAnswer',
        selectedProblemId: state.studyProblemId,
        problemEntrySource: 'study',
        selectedProblemTab: 'quickAnswer',
        codePageIndex: 0,
      }
    }

    return beginStudyQuestion(state, state.studySource ?? 'random', state.studyPattern)
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

  if (state.currentScreen === 'study') {
    return {
      ...state,
      currentScreen: 'home',
      selectedMenuIndex: getHomeMenuIndex('study'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'studyPattern') {
    return {
      ...state,
      currentScreen: 'study',
      selectedMenuIndex: getStudyMenuIndex('pattern'),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'studyQuestion') {
    if (state.studySource === 'pattern') {
      return {
        ...state,
        currentScreen: 'studyPattern',
        selectedMenuIndex: getStringIndex(context.patterns, state.studyPattern),
        codePageIndex: 0,
      }
    }

    return {
      ...state,
      currentScreen: 'study',
      selectedMenuIndex: getStudyMenuIndex(state.studySource),
      codePageIndex: 0,
    }
  }

  if (state.currentScreen === 'studyFeedback') {
    return {
      ...state,
      currentScreen: 'studyQuestion',
      studySelectedIndex: 0,
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
    state.currentScreen === 'quickAnswer' ||
    state.currentScreen === 'hint' ||
    state.currentScreen === 'approach' ||
    state.currentScreen === 'pseudocode' ||
    state.currentScreen === 'solution' ||
    state.currentScreen === 'edgeCases'
  ) {
    if (state.problemEntrySource === 'study') {
      return {
        ...state,
        currentScreen: 'studyFeedback',
        studySelectedIndex: 0,
        codePageIndex: 0,
      }
    }

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

  if (state.currentScreen === 'study') {
    return moveSelectedMenu(state, delta, STUDY_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'studyPattern') {
    return moveSelectedMenu(state, delta, context.patterns.length)
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
    return setProblemMenuIndex(state, state.selectedMenuIndex + delta)
  }

  if (state.currentScreen === 'studyQuestion') {
    return {
      ...state,
      studySelectedIndex: clampIndex(state.studySelectedIndex + delta, state.studyChoices.length),
    }
  }

  if (state.currentScreen === 'studyFeedback') {
    return {
      ...state,
      studySelectedIndex: clampIndex(
        state.studySelectedIndex + delta,
        getStudyFeedbackActionCount(state),
      ),
    }
  }

  if (
    state.currentScreen === 'quickAnswer' ||
    state.currentScreen === 'hint' ||
    state.currentScreen === 'approach' ||
    state.currentScreen === 'pseudocode' ||
    state.currentScreen === 'solution' ||
    state.currentScreen === 'edgeCases'
  ) {
    return movePage(state, delta, context.pageCount)
  }

  return state
}

export function transitionNavigationToIndex(
  state: NavigationState,
  targetIndex: number,
  context: NavigationContext,
): NavigationState {
  if (state.currentScreen === 'home') {
    return setSelectedMenuIndex(state, targetIndex, HOME_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'categories') {
    return setSelectedMenuIndex(state, targetIndex, context.categories.length)
  }

  if (state.currentScreen === 'find') {
    return setSelectedMenuIndex(state, targetIndex, FIND_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'study') {
    return setSelectedMenuIndex(state, targetIndex, STUDY_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'studyPattern') {
    return setSelectedMenuIndex(state, targetIndex, context.patterns.length)
  }

  if (state.currentScreen === 'patterns') {
    return setSelectedMenuIndex(state, targetIndex, context.patterns.length)
  }

  if (state.currentScreen === 'collections') {
    return setSelectedMenuIndex(state, targetIndex, context.collections.length)
  }

  if (state.currentScreen === 'settings') {
    return setSelectedMenuIndex(state, targetIndex, SETTINGS_MENU_ITEMS.length)
  }

  if (state.currentScreen === 'language') {
    return setSelectedMenuIndex(state, targetIndex, SELECTABLE_PROGRAMMING_LANGUAGES.length)
  }

  if (state.currentScreen === 'difficultyList') {
    return setSelectedMenuIndex(state, targetIndex, DIFFICULTIES.length)
  }

  if (state.currentScreen === 'problemList') {
    return setSelectedMenuIndex(state, targetIndex, context.problemListProblems.length)
  }

  if (state.currentScreen === 'voiceMatch') {
    return setSelectedMenuIndex(
      state,
      targetIndex,
      state.voiceResultMode === 'exact' ? 2 : 1,
    )
  }

  if (state.currentScreen === 'voiceResults') {
    return setSelectedMenuIndex(state, targetIndex, context.voiceResultProblems.length)
  }

  if (state.currentScreen === 'problem') {
    return setProblemMenuIndex(state, targetIndex)
  }

  if (state.currentScreen === 'studyQuestion') {
    return {
      ...state,
      studySelectedIndex: clampIndex(targetIndex, state.studyChoices.length),
    }
  }

  if (state.currentScreen === 'studyFeedback') {
    return {
      ...state,
      studySelectedIndex: clampIndex(targetIndex, getStudyFeedbackActionCount(state)),
    }
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
