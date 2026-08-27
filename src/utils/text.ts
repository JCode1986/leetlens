export function truncateLine(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`
}

export function wrapText(value: string, maxLineLength: number): string[] {
  const safeLineLength = Math.max(1, maxLineLength)
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  function pushWordParts(word: string): void {
    for (let index = 0; index < word.length; index += safeLineLength) {
      lines.push(word.slice(index, index + safeLineLength))
    }
  }

  for (const word of words) {
    if (word.length > safeLineLength) {
      if (currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = ''
      }

      pushWordParts(word)
      continue
    }

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
