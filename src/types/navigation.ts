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
  'solution',
] as const

export type NavigationScreen = (typeof NAVIGATION_SCREENS)[number]

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
}
