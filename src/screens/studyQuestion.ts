import { getProblemById } from '../services/problemService'
import type { NavigationState, StudyChoice } from '../types/navigation'
import { wrapHeader } from '../utils/text'
import {
  alignContentToX,
  centerContentInPaddedScreen,
  centerTitleContentInPaddedScreen,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTextGeometry,
  getPaddedScreenTextGeometry,
} from './g2Layout'

function getCorrectChoice(choices: StudyChoice[]): StudyChoice | undefined {
  return choices.find((choice) => choice.isCorrect)
}

function getQuestionLabel(state: NavigationState): string {
  if (state.studyQuestionType === 'time') {
    return 'TIME COMPLEXITY?'
  }

  return 'BEST PATTERN?'
}

export function createStudyQuestionTextObjects(state: NavigationState) {
  const problemId = state.studyProblemId ?? state.selectedProblemId
  const problem = problemId === undefined ? undefined : getProblemById(problemId)
  const choices = state.studyChoices
  const selectedIndex = Math.max(0, Math.min(choices.length - 1, state.studySelectedIndex))

  if (!problem || choices.length === 0 || !getCorrectChoice(choices)) {
    return createTextObjects([
      {
        ...getPaddedScreenTextGeometry(),
        y: 24,
        name: 'study-question-title',
        content: centerTitleContentInPaddedScreen('STUDY'),
        textColor: 4,
      },
      {
        ...getPaddedScreenTextGeometry(),
        y: 74,
        name: 'study-question-empty',
        content: centerContentInPaddedScreen('No question available.'),
        textColor: 3,
      },
    ])
  }

  const titleLines = wrapHeader(
    `#${problem.id} ${problem.title.toUpperCase()}`,
    G2_TEXT_LAYOUT.titleCharsPerLine,
  ).slice(0, 2)
  const labelY = 14 + titleLines.length * 26 + 10
  const choiceY = labelY + 44
  const questionLabel = getQuestionLabel(state)
  const choiceGeometry = getCenteredTextGeometry(
    choices.map((choice) => `> ${choice.label}`),
    160,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...getPaddedScreenTextGeometry(),
      y: 14,
      height: titleLines.length * 26,
      name: 'study-question-title',
      content: centerTitleContentInPaddedScreen(titleLines),
      textColor: 4,
    },
    {
      ...getPaddedScreenTextGeometry(),
      y: labelY,
      height: 24,
      name: 'study-question-label',
      content: centerContentInPaddedScreen(questionLabel),
      textColor: 3,
    },
    ...choices.map((choice, index) => {
      const selected = index === selectedIndex

      return {
        ...getPaddedScreenTextGeometry(),
        y: choiceY + index * 34,
        height: 26,
        name: `study-choice-${index}`,
        content: alignContentToX(`${selected ? '>' : ' '} ${choice.label}`, choiceGeometry.x),
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
