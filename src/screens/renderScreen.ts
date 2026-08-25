import type { TextContainerProperty } from '@evenrealities/even_hub_sdk'
import type { NavigationState } from '../types/navigation'
import { createApproachTextObjects, getApproachPageCount } from './approach'
import { createCategoriesTextObjects } from './categories'
import { createEdgeCasesTextObjects, getEdgeCasesPageCount } from './edgeCases'
import { createTextObjects } from './g2Layout'
import { createHintTextObjects, getHintPageCount } from './hint'
import { createHomeTextObjects } from './home'
import { createProblemTextObjects } from './problem'
import { createProblemListTextObjects } from './problemList'
import { createSolutionTextObjects, getSolutionPageCount } from './solution'

export function createScreenTextObjects(state: NavigationState): TextContainerProperty[] {
  if (state.currentScreen === 'home') {
    return createHomeTextObjects(state)
  }

  if (state.currentScreen === 'categories') {
    return createCategoriesTextObjects(state)
  }

  if (state.currentScreen === 'problemList') {
    return createProblemListTextObjects(state)
  }

  if (state.currentScreen === 'problem') {
    return createProblemTextObjects(state)
  }

  if (state.currentScreen === 'hint') {
    return createHintTextObjects(state)
  }

  if (state.currentScreen === 'approach') {
    return createApproachTextObjects(state)
  }

  if (state.currentScreen === 'solution') {
    return createSolutionTextObjects(state)
  }

  if (state.currentScreen === 'edgeCases') {
    return createEdgeCasesTextObjects(state)
  }

  return createTextObjects([
    {
      y: 24,
      name: 'unimplemented-title',
      content: 'LEETLENS',
      textColor: 4,
      isEventCapture: true,
    },
    {
      y: 72,
      name: 'unimplemented-message',
      content: 'Screen not ready.',
      textColor: 3,
    },
  ])
}

export function getCurrentScreenPageCount(state: NavigationState): number {
  if (state.currentScreen === 'hint') {
    return getHintPageCount(state)
  }

  if (state.currentScreen === 'approach') {
    return getApproachPageCount(state)
  }

  if (state.currentScreen === 'solution') {
    return getSolutionPageCount(state)
  }

  if (state.currentScreen === 'edgeCases') {
    return getEdgeCasesPageCount(state)
  }

  return 1
}
