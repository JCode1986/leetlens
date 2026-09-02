import { getCategories } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

const CATEGORY_ITEMS = getCategories()

export function createCategoriesTextObjects(state: NavigationState) {
  return createSelectableListTextObjects({
    title: 'Categories',
    items: CATEGORY_ITEMS,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'category',
    formatItem: (category) => category,
    emptyMessage: 'NO CATEGORIES FOUND',
  })
}
