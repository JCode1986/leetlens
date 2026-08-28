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

export function paginateLineGroups(
  lineGroups: string[][],
  linesPerPage: number,
): string[][] {
  if (linesPerPage <= 0) {
    return [lineGroups.flat()]
  }

  const groups = lineGroups
    .map((group) => group.filter((line) => line.length > 0))
    .filter((group) => group.length > 0)

  if (groups.length === 0) {
    return [[]]
  }

  const pages: string[][] = []
  let currentPage: string[] = []

  function pushPage(): void {
    if (currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
    }
  }

  for (const group of groups) {
    if (group.length <= linesPerPage) {
      if (currentPage.length > 0 && currentPage.length + group.length > linesPerPage) {
        pushPage()
      }

      currentPage.push(...group)
      continue
    }

    let remainingLines = [...group]

    while (remainingLines.length > 0) {
      if (currentPage.length === linesPerPage) {
        pushPage()
      }

      const availableLineCount = linesPerPage - currentPage.length
      currentPage.push(...remainingLines.slice(0, availableLineCount))
      remainingLines = remainingLines.slice(availableLineCount)

      if (remainingLines.length > 0) {
        pushPage()
      }
    }
  }

  pushPage()

  return pages.length > 0 ? pages : [[]]
}

export function clampPageIndex(pageIndex: number, pageCount: number): number {
  return Math.max(0, Math.min(Math.max(0, pageCount - 1), pageIndex))
}
