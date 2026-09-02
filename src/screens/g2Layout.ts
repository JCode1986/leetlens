import {
  CreateStartUpPageContainer,
  RebuildPageContainer,
  TextContainerProperty,
} from '@evenrealities/even_hub_sdk'

export const MAX_TEXT_CONTAINERS = 8
export const MAX_VISIBLE_TEXT_CONTAINERS = MAX_TEXT_CONTAINERS - 1
const G2_SCREEN_WIDTH = 576
const G2_SCREEN_HEIGHT = 288
const G2_EVENT_CAPTURE_WIDTH = 1
const G2_SCREEN_PADDING_X = 12
const G2_CONTENT_PADDING_X = 8
const DEFAULT_TEXT_X = G2_SCREEN_PADDING_X
const DEFAULT_TEXT_WIDTH = G2_SCREEN_WIDTH - G2_SCREEN_PADDING_X * 2
const CONTENT_TEXT_X = G2_CONTENT_PADDING_X
const CONTENT_TEXT_WIDTH = G2_SCREEN_WIDTH - G2_CONTENT_PADDING_X * 2
const MIN_TEXT_LINE_HEIGHT = 28
const ESTIMATED_CHARACTER_WIDTH = 9
const ESTIMATED_TITLE_CHARACTER_WIDTH = 12
const CENTERED_TEXT_PADDING = 16
const NAVIGABLE_TEXT_PADDING = 44
const MAX_CENTERED_CONTENT_WIDTH = Math.floor(G2_SCREEN_WIDTH * 0.97)
const MAX_CENTERED_CONTENT_CHARS = Math.floor(
  (MAX_CENTERED_CONTENT_WIDTH - CENTERED_TEXT_PADDING) / ESTIMATED_CHARACTER_WIDTH,
)
const TITLE_CHARS_PER_LINE = Math.floor(DEFAULT_TEXT_WIDTH / ESTIMATED_TITLE_CHARACTER_WIDTH)

export const G2_TEXT_LAYOUT = {
  screenWidth: G2_SCREEN_WIDTH,
  screenHeight: G2_SCREEN_HEIGHT,
  screenPaddingX: G2_SCREEN_PADDING_X,
  defaultTextX: DEFAULT_TEXT_X,
  defaultTextWidth: DEFAULT_TEXT_WIDTH,
  contentTextX: CONTENT_TEXT_X,
  contentTextWidth: CONTENT_TEXT_WIDTH,
  maxCenteredContentWidth: MAX_CENTERED_CONTENT_WIDTH,
  maxCenteredContentCharsPerLine: MAX_CENTERED_CONTENT_CHARS,
  contentCharsPerLine: Math.floor(CONTENT_TEXT_WIDTH / ESTIMATED_CHARACTER_WIDTH),
  titleCharsPerLine: TITLE_CHARS_PER_LINE,
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
  eventCapture?: boolean
}

export function createPageEventCaptureSpec(
  name: string,
  geometry: Partial<Pick<TextSpec, 'x' | 'y' | 'width' | 'height'>> = {},
): TextSpec {
  return {
    x: 0,
    y: 0,
    ...geometry,
    width: G2_EVENT_CAPTURE_WIDTH,
    height: G2_SCREEN_HEIGHT,
    name,
    content: ' ',
    textColor: 0,
    eventCapture: true,
  }
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

export function getNavigableTextGeometry(
  content: string | string[],
  minWidth = 140,
  maxWidth = DEFAULT_TEXT_WIDTH,
) {
  const width = clampWidth(
    getLongestLineLength(content) * ESTIMATED_CHARACTER_WIDTH + NAVIGABLE_TEXT_PADDING,
    minWidth,
    maxWidth,
  )

  return {
    x: Math.round((G2_SCREEN_WIDTH - width) / 2),
    width,
  }
}

export function getPaddedScreenTextGeometry() {
  return {
    x: DEFAULT_TEXT_X,
    width: DEFAULT_TEXT_WIDTH,
  }
}

export function getCenteredContentTextGeometry() {
  return {
    x: CONTENT_TEXT_X,
    width: CONTENT_TEXT_WIDTH,
  }
}

export function getCenteredContentBlockGeometry(content: string | string[]) {
  return getCenteredLineGeometry(
    content,
    ESTIMATED_CHARACTER_WIDTH,
    CENTERED_TEXT_PADDING * 2,
  )
}

function getIndentForX(x: number, characterWidth: number): string {
  return ' '.repeat(Math.max(0, Math.round((x - DEFAULT_TEXT_X) / characterWidth)))
}

export function centerContentInPaddedScreen(
  content: string | string[],
  characterWidth = ESTIMATED_CHARACTER_WIDTH,
): string {
  const lines = Array.isArray(content) ? content : content.split('\n')

  return lines.map((line) => {
    const trimmedLine = line.trim()
    const textWidth = clampWidth(
      trimmedLine.length * characterWidth,
      1,
      DEFAULT_TEXT_WIDTH,
    )
    const x = Math.round((G2_SCREEN_WIDTH - textWidth) / 2)

    return `${getIndentForX(x, characterWidth)}${trimmedLine}`
  }).join('\n')
}

export function centerTitleContentInPaddedScreen(content: string | string[]): string {
  return centerContentInPaddedScreen(content, ESTIMATED_TITLE_CHARACTER_WIDTH)
}

export function getCenteredLineGeometry(
  content: string | string[],
  characterWidth = ESTIMATED_CHARACTER_WIDTH,
  padding = CENTERED_TEXT_PADDING * 2,
) {
  const textWidth = clampWidth(
    getLongestLineLength(content) * characterWidth,
    1,
    G2_SCREEN_WIDTH,
  )
  const x = Math.round((G2_SCREEN_WIDTH - textWidth) / 2)

  return {
    x,
    width: Math.min(G2_SCREEN_WIDTH - x, textWidth + padding),
  }
}

export function getCenteredTitleGeometry(
  content: string | string[],
  padding = CENTERED_TEXT_PADDING * 2,
) {
  return getCenteredLineGeometry(content, ESTIMATED_TITLE_CHARACTER_WIDTH, padding)
}

export function getCenteredTitleContent(content: string | string[]): string {
  const lines = Array.isArray(content) ? content : content.split('\n')

  return lines.map((line) => line.trim()).join('\n')
}

function getLineCount(content: string): number {
  return Math.max(1, content.split('\n').length)
}

function getSafeTextHeight(spec: TextSpec): number {
  if (spec.eventCapture) {
    return spec.height ?? MIN_TEXT_LINE_HEIGHT
  }

  const requestedHeight = spec.height ?? MIN_TEXT_LINE_HEIGHT
  const minimumHeight = getLineCount(spec.content) * MIN_TEXT_LINE_HEIGHT

  return Math.max(requestedHeight, minimumHeight)
}

function createDefaultEventCaptureSpec(specs: TextSpec[]): TextSpec {
  return createPageEventCaptureSpec(`${specs[0]?.name.split('-')[0] ?? 'screen'}-capture`)
}

export function createTextObjects(specs: TextSpec[]): TextContainerProperty[] {
  const captureSpec = specs.find((spec) => spec.eventCapture) ?? createDefaultEventCaptureSpec(specs)
  const passiveSpecs = specs
    .filter((spec) => !spec.eventCapture)
    .slice(0, MAX_VISIBLE_TEXT_CONTAINERS)
  const textSpecs = [captureSpec, ...passiveSpecs]

  return textSpecs.map(
    (spec, index) =>
      new TextContainerProperty({
        xPosition: spec.x ?? DEFAULT_TEXT_X,
        yPosition: spec.y,
        width: spec.width ?? DEFAULT_TEXT_WIDTH,
        height: getSafeTextHeight(spec),
        borderWidth: 0,
        borderColor: 0,
        borderRadius: 0,
        paddingLength: 0,
        containerID: 1000 + index,
        containerName: spec.name,
        zOrderIndex: index + 1,
        content: spec.content.length > 0 ? spec.content : ' ',
        textColor: spec.textColor ?? 4,
        isEventCapture: spec.eventCapture ? 1 : 0,
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
