import type { SelectableProgrammingLanguage } from '../utils/language'
import type { Difficulty } from './problem'

export const NAVIGATION_SCREENS = [
  'home',
  'exitConfirm',
  'categories',
  'patterns',
  'collections',
  'find',
  'study',
  'studyPattern',
  'studyQuestion',
  'studyFeedback',
  'favorites',
  'recent',
  'settings',
  'language',
  'voiceSearch',
  'voiceMatch',
  'voiceResults',
  'difficultyList',
  'problemList',
  'problem',
  'quickAnswer',
  'hint',
  'approach',
  'pseudocode',
  'solution',
  'edgeCases',
] as const

export type NavigationScreen = (typeof NAVIGATION_SCREENS)[number]

export const PROBLEM_TABS = [
  { label: 'Quick Answer', screen: 'quickAnswer' },
  { label: 'Hint', screen: 'hint' },
  { label: 'Approach', screen: 'approach' },
  { label: 'Pseudocode', screen: 'pseudocode' },
  { label: 'Solution', screen: 'solution' },
  { label: 'Edge Cases', screen: 'edgeCases' },
] as const

export type ProblemTab = (typeof PROBLEM_TABS)[number]['screen']

export const PROBLEM_CONTENT_SCREENS: readonly ProblemTab[] = PROBLEM_TABS.map(
  (tab) => tab.screen,
)

const PROBLEM_CONTENT_SCREEN_SET = new Set<NavigationScreen>(PROBLEM_CONTENT_SCREENS)

export const PROBLEM_FAVORITE_MENU_INDEX = PROBLEM_TABS.length
export const PROBLEM_MENU_ITEM_COUNT = PROBLEM_TABS.length + 1

export type ProblemContentScreen = (typeof PROBLEM_CONTENT_SCREENS)[number]

export function isProblemContentScreen(
  screen: NavigationScreen,
): screen is ProblemContentScreen {
  return PROBLEM_CONTENT_SCREEN_SET.has(screen)
}

export const HOME_MENU_ITEMS = [
  { label: 'Categories', screen: 'categories' },
  { label: 'Patterns', screen: 'patterns' },
  { label: 'Collections', screen: 'collections' },
  { label: 'Find', screen: 'find' },
  { label: 'Study', screen: 'study' },
  { label: 'Favorites', screen: 'favorites' },
  { label: 'Recent', screen: 'recent' },
  { label: 'Settings', screen: 'settings' },
  { label: 'Exit App', screen: 'exitConfirm' },
] as const

export const EXIT_CONFIRM_ACTIONS = ['Cancel', 'Exit App'] as const
export const EXIT_CONFIRM_EXIT_INDEX = 1

export const SETTINGS_MENU_ITEMS = [
  { label: 'Language', screen: 'language' },
] as const

export const FIND_MENU_ITEMS = [
  { label: 'Voice Search', screen: 'voiceSearch' },
  { label: 'All Problems', screen: 'problemList' },
  { label: 'By Difficulty', screen: 'difficultyList' },
] as const

export const STUDY_MENU_ITEMS = [
  { label: 'Random Problem', source: 'random' },
  { label: 'By Pattern', source: 'pattern' },
  { label: 'Blind 75', source: 'blind75' },
] as const

export type StudySource = 'random' | 'pattern' | 'blind75'
export type StudyQuestionType = 'pattern' | 'time'

export interface StudyChoice {
  label: string
  isCorrect: boolean
}

export type ProblemListSource =
  | 'category'
  | 'pattern'
  | 'collection'
  | 'all'
  | 'difficulty'
  | 'favorites'
  | 'recent'
export type ProblemEntrySource = 'problemList' | 'voiceMatch' | 'voiceResults' | 'study'
export type VoiceSearchStatus = 'idle' | 'listening' | 'processing' | 'error'
export type VoiceResultMode = 'exact' | 'possible' | 'related' | 'none'

export interface NavigationState {
  currentScreen: NavigationScreen
  selectedMenuIndex: number
  selectedCategory: string | undefined
  selectedPattern: string | undefined
  selectedCollection: string | undefined
  selectedDifficulty: Difficulty | undefined
  problemListSource: ProblemListSource | undefined
  selectedProblemId: number | undefined
  problemEntrySource: ProblemEntrySource | undefined
  selectedLanguage: SelectableProgrammingLanguage
  selectedProblemTab: ProblemTab
  codePageIndex: number
  voiceSearchStatus: VoiceSearchStatus
  voiceTranscript: string
  voiceError: string | undefined
  voiceResultMode: VoiceResultMode | undefined
  voiceResultProblemIds: number[]
  studySource: StudySource | undefined
  studyPattern: string | undefined
  studyProblemId: number | undefined
  studyQuestionType: StudyQuestionType | undefined
  studyChoices: StudyChoice[]
  studySelectedIndex: number
  studyAnswered: boolean
  studyCorrect: boolean | undefined
  studyRecentProblemIds: number[]
}
