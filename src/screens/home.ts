import {
  CreateStartUpPageContainer,
  StartUpPageCreateResult,
  TextContainerProperty,
} from '@evenrealities/even_hub_sdk'
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { clampHomeMenuIndex } from '../navigation/navigationState'
import { HOME_MENU_ITEMS } from '../types/navigation'
import type { NavigationState } from '../types/navigation'

export const G2_DISPLAY = {
  width: 576,
  height: 288,
} as const

const TITLE_CONTAINER_ID = 100
const SUBTITLE_CONTAINER_ID = 101
const MENU_CONTAINER_ID_START = 200

export function createHomeStartUpPage(
  navigationState: NavigationState,
): CreateStartUpPageContainer {
  const selectedMenuIndex = clampHomeMenuIndex(navigationState.selectedMenuIndex)
  const textObject = [
    new TextContainerProperty({
      xPosition: 36,
      yPosition: 22,
      width: 504,
      height: 38,
      containerID: TITLE_CONTAINER_ID,
      containerName: 'home-title',
      zOrderIndex: 1,
      content: 'LEETLENS',
      textColor: 4,
      isEventCapture: 0,
    }),
    new TextContainerProperty({
      xPosition: 36,
      yPosition: 70,
      width: 504,
      height: 52,
      containerID: SUBTITLE_CONTAINER_ID,
      containerName: 'home-subtitle',
      zOrderIndex: 2,
      content: 'Coding Interview\nStudy Companion',
      textColor: 3,
      isEventCapture: 0,
    }),
    ...HOME_MENU_ITEMS.map(
      (item, index) =>
        new TextContainerProperty({
          xPosition: 50,
          yPosition: 136 + index * 24,
          width: 320,
          height: 23,
          containerID: MENU_CONTAINER_ID_START + index,
          containerName: `home-menu-${item.screen}`,
          zOrderIndex: 3 + index,
          content: `${index === selectedMenuIndex ? '>' : ' '} ${item.label}`,
          textColor: index === selectedMenuIndex ? 4 : 3,
          isEventCapture: index === selectedMenuIndex ? 1 : 0,
        }),
    ),
  ]

  return new CreateStartUpPageContainer({
    containerTotalNum: textObject.length,
    textObject,
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
