import type { SelectableProgrammingLanguage } from '../utils/language'
import type { Difficulty } from './problem'

export const NAVIGATION_SCREENS = [
  'home',
  'categories',
  'patterns',
  'collections',
  'find',
  'search',
  'favorites',
  'settings',
  'language',
  'voiceSearch',
  'voiceMatch',
  'voiceResults',
  'difficultyList',
  'problemList',
  'problem',
  'hint',
  'approach',
  'solution',
  'edgeCases',
] as const

export type NavigationScreen = (typeof NAVIGATION_SCREENS)[number]

export const PROBLEM_TABS = [
  { label: 'Hint', screen: 'hint' },
  { label: 'Approach', screen: 'approach' },
  { label: 'Solution', screen: 'solution' },
  { label: 'Edge Cases', screen: 'edgeCases' },
] as const

export type ProblemTab = (typeof PROBLEM_TABS)[number]['screen']

export const HOME_MENU_ITEMS = [
  { label: 'Categories', screen: 'categories' },
  { label: 'Patterns', screen: 'patterns' },
  { label: 'Collections', screen: 'collections' },
  { label: 'Find', screen: 'find' },
  { label: 'Favorites', screen: 'favorites' },
  { label: 'Settings', screen: 'settings' },
] as const

export type HomeMenuItem = (typeof HOME_MENU_ITEMS)[number]

export const SETTINGS_MENU_ITEMS = [
  { label: 'Language', screen: 'language' },
] as const

export type SettingsMenuItem = (typeof SETTINGS_MENU_ITEMS)[number]

export const FIND_MENU_ITEMS = [
  { label: 'Voice Search', screen: 'voiceSearch' },
  { label: 'All Problems', screen: 'problemList' },
  { label: 'By Difficulty', screen: 'difficultyList' },
] as const

export type FindMenuItem = (typeof FIND_MENU_ITEMS)[number]

export type ProblemListSource = 'category' | 'pattern' | 'collection' | 'all' | 'difficulty'
export type ProblemEntrySource = 'problemList' | 'voiceMatch' | 'voiceResults'
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
}
