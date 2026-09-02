import { getCollections } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

const COLLECTION_ITEMS = getCollections()

export function createCollectionsTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'Collections',
    items: COLLECTION_ITEMS,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'collection',
    formatItem: (collection) => collection,
    emptyMessage: 'NO COLLECTIONS FOUND',
  })
}
