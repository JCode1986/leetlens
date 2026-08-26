import {
  CreateStartUpPageContainer,
  StartUpPageCreateResult,
} from '@evenrealities/even_hub_sdk'
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { clampHomeMenuIndex } from '../navigation/navigationState'
import { HOME_MENU_ITEMS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createHomeTextObjects(navigationState: NavigationState) {
  const selectedMenuIndex = clampHomeMenuIndex(navigationState.selectedMenuIndex)

  return createSelectableListTextObjects({
    title: 'LeetLens',
    items: [...HOME_MENU_ITEMS],
    selectedIndex: selectedMenuIndex,
    itemNamePrefix: 'home',
    formatItem: (item) => item.label,
    maxVisibleItems: HOME_MENU_ITEMS.length,
  })
}

export function createHomeStartUpPage(
  navigationState: NavigationState,
): CreateStartUpPageContainer {
  return new CreateStartUpPageContainer({
    containerTotalNum: createHomeTextObjects(navigationState).length,
    textObject: createHomeTextObjects(navigationState),
  })
}

export async function renderHomeScreen(
  bridge: EvenAppBridge,
  navigationState: NavigationState,
): Promise<StartUpPageCreateResult> {
  return bridge.createStartUpPageContainer(createHomeStartUpPage(navigationState))
}

export function renderHomeDomPreview(
  root: HTMLElement,
  navigationState: NavigationState,
): void {
  const selectedMenuIndex = clampHomeMenuIndex(navigationState.selectedMenuIndex)
  const menuMarkup = HOME_MENU_ITEMS.map((item, index) => {
    const selected = index === selectedMenuIndex

    return `
      <div class="menu-row${selected ? ' selected' : ''}" aria-current="${selected}">
        <span class="cursor">${selected ? '>' : ''}</span>
        <span>${item.label}</span>
      </div>
    `
  }).join('')

  root.innerHTML = `
    <main class="g2-preview" aria-label="LeetLens G2 home screen">
      <section class="home-screen">
        <h1>LEETLENS</h1>
        <p>Coding Interview<br />Study Companion</p>
        <nav class="menu" aria-label="LeetLens sections">
          ${menuMarkup}
        </nav>
      </section>
    </main>
  `
}
