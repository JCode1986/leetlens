import {
  CreateStartUpPageContainer,
  RebuildPageContainer,
  TextContainerProperty,
} from '@evenrealities/even_hub_sdk'

export const MAX_TEXT_CONTAINERS = 8
const G2_SCREEN_WIDTH = 576
const G2_SCREEN_PADDING_X = 12
const DEFAULT_TEXT_X = G2_SCREEN_PADDING_X
const DEFAULT_TEXT_WIDTH = G2_SCREEN_WIDTH - G2_SCREEN_PADDING_X * 2
const ESTIMATED_CHARACTER_WIDTH = 12
const CENTERED_TEXT_PADDING = 16

export const G2_TEXT_LAYOUT = {
  screenWidth: G2_SCREEN_WIDTH,
  defaultCharsPerLine: 36,
  proseCharsPerLine: 28,
  listItemX: G2_SCREEN_PADDING_X,
  listItemWidth: DEFAULT_TEXT_WIDTH,
} as const

export interface TextSpec {
  x?: number
  y: number
  width?: number
  height?: number
  content: string
  name: string
  textColor?: number
}

function getLongestLineLength(content: string | string[]): number {
  const lines = Array.isArray(content) ? content : content.split('\n')

  return lines.reduce((longest, line) => Math.max(longest, line.length), 0)
}

function clampWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.min(maxWidth, Math.max(minWidth, width))
}

export function getCenteredTextGeometry(
  content: string | string[],
  minWidth = 80,
  maxWidth = DEFAULT_TEXT_WIDTH,
) {
  const width = clampWidth(
    getLongestLineLength(content) * ESTIMATED_CHARACTER_WIDTH + CENTERED_TEXT_PADDING,
    minWidth,
    maxWidth,
  )

  return {
    x: Math.round((G2_SCREEN_WIDTH - width) / 2),
    width,
  }
}

export function createTextObjects(specs: TextSpec[]): TextContainerProperty[] {
  const visibleSpecs = specs.slice(0, MAX_TEXT_CONTAINERS)

  return visibleSpecs.map(
    (spec, index) =>
      new TextContainerProperty({
        xPosition: spec.x ?? DEFAULT_TEXT_X,
        yPosition: spec.y,
        width: spec.width ?? DEFAULT_TEXT_WIDTH,
        height: spec.height ?? 24,
        containerID: 1000 + index,
        containerName: spec.name,
        zOrderIndex: index + 1,
        content: spec.content.length > 0 ? spec.content : ' ',
        textColor: spec.textColor ?? 4,
        isEventCapture: index === 0 ? 1 : 0,
      }),
  )
}

export function countEventCaptureContainers(textObject: TextContainerProperty[]): number {
  return textObject.filter((text) => text.isEventCapture === 1).length
}

export function createStartUpPage(textObject: TextContainerProperty[]): CreateStartUpPageContainer {
  return new CreateStartUpPageContainer({
    containerTotalNum: textObject.length,
    textObject,
  })
}

export function createRebuildPage(textObject: TextContainerProperty[]): RebuildPageContainer {
  return new RebuildPageContainer({
    containerTotalNum: textObject.length,
    textObject,
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function renderTextObjectsDomPreview(
  root: HTMLElement,
  textObject: TextContainerProperty[],
): void {
  const textMarkup = textObject.map((text) => {
    const x = text.xPosition ?? 0
    const y = text.yPosition ?? 0
    const width = text.width ?? DEFAULT_TEXT_WIDTH
    const height = text.height ?? 24
    const colorClass = text.textColor === 3 ? 'muted' : 'primary'

    return `
      <div
        class="g2-text ${colorClass}"
        style="left:${x}px;top:${y}px;width:${width}px;height:${height}px"
      >${escapeHtml(text.content ?? '')}</div>
    `
  }).join('')

  root.innerHTML = `
    <main class="g2-preview" aria-label="LeetLens G2 screen">
      ${textMarkup}
    </main>
  `
}
