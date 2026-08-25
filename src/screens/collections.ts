import { getCollections } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createCollectionsTextObjects(state: NavigationState) {
  const collections = getCollections()

  return createSelectableListTextObjects({
    title: 'Collections',
    items: collections,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'collection',
    formatItem: (collection) => collection,
    emptyMessage: 'NO COLLECTIONS FOUND',
  })
}
