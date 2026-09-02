import type { TextContainerProperty } from '@evenrealities/even_hub_sdk'
import type { NavigationState } from '../types/navigation'
import { createApproachTextObjects, getApproachPageCount } from './approach'
import { createCategoriesTextObjects } from './categories'
import { createEdgeCasesTextObjects, getEdgeCasesPageCount } from './edgeCases'
import { createExitConfirmTextObjects } from './exitConfirm'
import { createDifficultyListTextObjects } from './difficultyList'
import { createFindTextObjects } from './find'
import {
  createTextObjects,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
} from './g2Layout'
import { createHintTextObjects, getHintPageCount } from './hint'
import { createHomeTextObjects } from './home'
import { createLanguageTextObjects } from './language'
import { createCollectionsTextObjects } from './collections'
import { createPatternsTextObjects } from './patterns'
import { createProblemTextObjects } from './problem'
import { createProblemListTextObjects } from './problemList'
import { createPseudocodeTextObjects, getPseudocodePageCount } from './pseudocode'
import { createQuickAnswerTextObjects, getQuickAnswerPageCount } from './quickAnswer'
import { createSettingsTextObjects } from './settings'
import { createSolutionTextObjects, getSolutionPageCount } from './solution'
import { createStudyTextObjects } from './study'
import { createStudyFeedbackTextObjects } from './studyFeedback'
import { createStudyPatternTextObjects } from './studyPattern'
import { createStudyQuestionTextObjects } from './studyQuestion'
import { createVoiceMatchTextObjects } from './voiceMatch'
import { createVoiceResultsTextObjects } from './voiceResults'
import { createVoiceSearchTextObjects } from './voiceSearch'

type ScreenRenderer = (state: NavigationState) => TextContainerProperty[]
type PageCountGetter = (state: NavigationState) => number

const SCREEN_RENDERERS: Partial<Record<NavigationState['currentScreen'], ScreenRenderer>> = {
  home: createHomeTextObjects,
  exitConfirm: createExitConfirmTextObjects,
  categories: createCategoriesTextObjects,
  patterns: createPatternsTextObjects,
  collections: createCollectionsTextObjects,
  find: createFindTextObjects,
  study: createStudyTextObjects,
  studyPattern: createStudyPatternTextObjects,
  studyQuestion: createStudyQuestionTextObjects,
  studyFeedback: createStudyFeedbackTextObjects,
  voiceSearch: createVoiceSearchTextObjects,
  voiceMatch: createVoiceMatchTextObjects,
  voiceResults: createVoiceResultsTextObjects,
  difficultyList: createDifficultyListTextObjects,
  settings: createSettingsTextObjects,
  language: createLanguageTextObjects,
  problemList: createProblemListTextObjects,
  problem: createProblemTextObjects,
  quickAnswer: createQuickAnswerTextObjects,
  hint: createHintTextObjects,
  approach: createApproachTextObjects,
  pseudocode: createPseudocodeTextObjects,
  solution: createSolutionTextObjects,
  edgeCases: createEdgeCasesTextObjects,
}

const PAGE_COUNT_GETTERS: Partial<Record<NavigationState['currentScreen'], PageCountGetter>> = {
  quickAnswer: getQuickAnswerPageCount,
  hint: getHintPageCount,
  approach: getApproachPageCount,
  pseudocode: getPseudocodePageCount,
  solution: getSolutionPageCount,
  edgeCases: getEdgeCasesPageCount,
}

function createFallbackTextObjects(): TextContainerProperty[] {
  return createTextObjects([
    {
      ...getCenteredTitleGeometry('LEETLENS'),
      y: 24,
      name: 'unimplemented-title',
      content: getCenteredTitleContent('LEETLENS'),
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry('Screen not ready.'),
      y: 72,
      name: 'unimplemented-message',
      content: 'Screen not ready.',
      textColor: 3,
    },
  ])
}

export function createScreenTextObjects(state: NavigationState): TextContainerProperty[] {
  return SCREEN_RENDERERS[state.currentScreen]?.(state) ?? createFallbackTextObjects()
}

export function getCurrentScreenPageCount(state: NavigationState): number {
  return PAGE_COUNT_GETTERS[state.currentScreen]?.(state) ?? 1
}
