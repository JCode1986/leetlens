import type { ProgrammingLanguage } from './problem'

export const NAVIGATION_SCREENS = [
  'home',
  'categories',
  'patterns',
  'collections',
  'search',
  'favorites',
  'settings',
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
  { label: 'Search', screen: 'search' },
  { label: 'Favorites', screen: 'favorites' },
  { label: 'Settings', screen: 'settings' },
] as const

export type HomeMenuItem = (typeof HOME_MENU_ITEMS)[number]

export interface NavigationState {
  currentScreen: NavigationScreen
  selectedMenuIndex: number
  selectedCategory: string | undefined
  selectedProblemId: number | undefined
  selectedLanguage: ProgrammingLanguage
  selectedProblemTab: ProblemTab
  codePageIndex: number
}
