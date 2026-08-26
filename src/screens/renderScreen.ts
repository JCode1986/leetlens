import type { TextContainerProperty } from '@evenrealities/even_hub_sdk'
import type { NavigationState } from '../types/navigation'
import { createApproachTextObjects, getApproachPageCount } from './approach'
import { createCategoriesTextObjects } from './categories'
import { createEdgeCasesTextObjects, getEdgeCasesPageCount } from './edgeCases'
import { createDifficultyListTextObjects } from './difficultyList'
import { createFindTextObjects } from './find'
import { createTextObjects } from './g2Layout'
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

export function createScreenTextObjects(state: NavigationState): TextContainerProperty[] {
  if (state.currentScreen === 'home') {
    return createHomeTextObjects(state)
  }

  if (state.currentScreen === 'categories') {
    return createCategoriesTextObjects(state)
  }

  if (state.currentScreen === 'patterns') {
    return createPatternsTextObjects(state)
  }

  if (state.currentScreen === 'collections') {
    return createCollectionsTextObjects(state)
  }

  if (state.currentScreen === 'find') {
    return createFindTextObjects(state)
  }

  if (state.currentScreen === 'study') {
    return createStudyTextObjects(state)
  }

  if (state.currentScreen === 'studyPattern') {
    return createStudyPatternTextObjects(state)
  }

  if (state.currentScreen === 'studyQuestion') {
    return createStudyQuestionTextObjects(state)
  }

  if (state.currentScreen === 'studyFeedback') {
    return createStudyFeedbackTextObjects(state)
  }

  if (state.currentScreen === 'voiceSearch') {
    return createVoiceSearchTextObjects(state)
  }

  if (state.currentScreen === 'voiceMatch') {
    return createVoiceMatchTextObjects(state)
  }

  if (state.currentScreen === 'voiceResults') {
    return createVoiceResultsTextObjects(state)
  }

  if (state.currentScreen === 'difficultyList') {
    return createDifficultyListTextObjects(state)
  }

  if (state.currentScreen === 'settings') {
    return createSettingsTextObjects(state)
  }

  if (state.currentScreen === 'language') {
    return createLanguageTextObjects(state)
  }

  if (state.currentScreen === 'problemList') {
    return createProblemListTextObjects(state)
  }

  if (state.currentScreen === 'problem') {
    return createProblemTextObjects(state)
  }

  if (state.currentScreen === 'quickAnswer') {
    return createQuickAnswerTextObjects(state)
  }

  if (state.currentScreen === 'hint') {
    return createHintTextObjects(state)
  }

  if (state.currentScreen === 'approach') {
    return createApproachTextObjects(state)
  }

  if (state.currentScreen === 'pseudocode') {
    return createPseudocodeTextObjects(state)
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
  if (state.currentScreen === 'quickAnswer') {
    return getQuickAnswerPageCount(state)
  }

  if (state.currentScreen === 'hint') {
    return getHintPageCount(state)
  }

  if (state.currentScreen === 'approach') {
    return getApproachPageCount(state)
  }

  if (state.currentScreen === 'pseudocode') {
    return getPseudocodePageCount(state)
  }

  if (state.currentScreen === 'solution') {
    return getSolutionPageCount(state)
  }

  if (state.currentScreen === 'edgeCases') {
    return getEdgeCasesPageCount(state)
  }

  return 1
}
