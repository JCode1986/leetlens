import { HOME_MENU_ITEMS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'

export function createInitialNavigationState(): NavigationState {
  return {
    currentScreen: 'home',
    selectedMenuIndex: 0,
  }
}

export function clampHomeMenuIndex(index: number): number {
  return Math.max(0, Math.min(HOME_MENU_ITEMS.length - 1, index))
}

export function setSelectedMenuIndex(
  state: NavigationState,
  selectedMenuIndex: number,
): NavigationState {
  return {
    ...state,
    selectedMenuIndex: clampHomeMenuIndex(selectedMenuIndex),
  }
}
