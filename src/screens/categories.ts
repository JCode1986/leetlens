import { getCategories } from '../services/problemService'
import type { NavigationState } from '../types/navigation'
import { createSelectableListTextObjects } from './selectableList'

export function createCategoriesTextObjects(state: NavigationState) {
  const categories = getCategories()

  return createSelectableListTextObjects({
    title: 'Categories',
    items: categories,
    selectedIndex: state.selectedMenuIndex,
    itemNamePrefix: 'category',
    formatItem: (category) => category,
    emptyMessage: 'NO CATEGORIES FOUND',
  })
}
