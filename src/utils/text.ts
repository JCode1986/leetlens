function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function wrapWords(value: string, maxLineLength: number): string[] {
  const safeLineLength = Math.max(1, maxLineLength)
  const words = normalizeText(value).split(' ').filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word
      continue
    }

    const candidate = `${currentLine} ${word}`

    if (candidate.length <= safeLineLength) {
      currentLine = candidate
      continue
    }

    lines.push(currentLine)
    currentLine = word
  }

  return currentLine.length > 0 ? [...lines, currentLine] : lines
}

export function wrapText(value: string, maxLineLength: number): string[] {
  return wrapWords(value, maxLineLength)
}

export function wrapHeader(value: string, maxLineLength: number): string[] {
  return wrapWords(value, maxLineLength)
}

export function wrapParagraph(value: string, maxLineLength: number): string[] {
  return wrapWords(value, maxLineLength)
}

export function wrapPrefixedText(
  prefix: string,
  value: string,
  maxLineLength: number,
): string[] {
  const continuationPrefix = ' '.repeat(prefix.length)
  const wrapped = wrapText(value, Math.max(1, maxLineLength - prefix.length))

  if (wrapped.length === 0) {
    return [prefix.trimEnd()]
  }

  return wrapped.map((line, index) => `${index === 0 ? prefix : continuationPrefix}${line}`)
}

export function wrapNumberedItem(
  number: number,
  value: string,
  maxLineLength: number,
): string[] {
  return wrapPrefixedText(`${number}. `, value, maxLineLength)
}

export function wrapBulletItem(value: string, maxLineLength: number): string[] {
  return wrapPrefixedText('\u2022 ', value, maxLineLength)
}

export function wrapLabelValue(
  label: string,
  value: string,
  maxLineLength: number,
): string[] {
  return [
    label,
    ...wrapParagraph(value, maxLineLength),
  ]
}
