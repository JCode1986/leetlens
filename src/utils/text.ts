export function truncateLine(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength)
  }

  return `${value.slice(0, maxLength - 3)}...`
}

export function wrapText(value: string, maxLineLength: number): string[] {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word
      continue
    }

    const candidate = `${currentLine} ${word}`

    if (candidate.length <= maxLineLength) {
      currentLine = candidate
      continue
    }

    lines.push(currentLine)
    currentLine = word
  }

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
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
