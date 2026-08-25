export function paginateLines(lines: string[], linesPerPage: number): string[][] {
  if (linesPerPage <= 0) {
    return [lines]
  }

  if (lines.length === 0) {
    return [[]]
  }

  const pages: string[][] = []

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage))
  }

  return pages
}

export function clampPageIndex(pageIndex: number, pageCount: number): number {
  return Math.max(0, Math.min(Math.max(0, pageCount - 1), pageIndex))
}
