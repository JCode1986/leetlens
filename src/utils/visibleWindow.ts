export interface VisibleWindow<T> {
  items: T[]
  startIndex: number
}

export function getVisibleWindow<T>(
  items: T[],
  selectedIndex: number,
  maxVisibleItems: number,
): VisibleWindow<T> {
  if (maxVisibleItems <= 0 || items.length === 0) {
    return {
      items: [],
      startIndex: 0,
    }
  }

  const clampedIndex = Math.max(0, Math.min(items.length - 1, selectedIndex))
  const halfWindow = Math.floor(maxVisibleItems / 2)
  const maxStartIndex = Math.max(0, items.length - maxVisibleItems)
  const startIndex = Math.max(0, Math.min(clampedIndex - halfWindow, maxStartIndex))

  return {
    items: items.slice(startIndex, startIndex + maxVisibleItems),
    startIndex,
  }
}
