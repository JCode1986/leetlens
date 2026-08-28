import { getProblemById } from '../services/problemService'
import type { NavigationState, StudyChoice } from '../types/navigation'
import { wrapHeader } from '../utils/text'
import {
  createTextObjects,
  G2_TEXT_LAYOUT,
  getCenteredTitleContent,
  getCenteredTitleGeometry,
  getCenteredTextGeometry,
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
        ...getCenteredTitleGeometry('STUDY'),
        y: 24,
        name: 'study-question-title',
        content: getCenteredTitleContent('STUDY'),
        textColor: 4,
      },
      {
        ...getCenteredTextGeometry('No question available.'),
        y: 74,
        name: 'study-question-empty',
        content: 'No question available.',
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
      ...getCenteredTitleGeometry(titleLines),
      y: 14,
      height: titleLines.length * 26,
      name: 'study-question-title',
      content: getCenteredTitleContent(titleLines),
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry(questionLabel),
      y: labelY,
      height: 24,
      name: 'study-question-label',
      content: questionLabel,
      textColor: 3,
    },
    ...choices.map((choice, index) => {
      const selected = index === selectedIndex

      return {
        x: choiceGeometry.x,
        y: choiceY + index * 34,
        width: choiceGeometry.width,
        height: 26,
        name: `study-choice-${index}`,
        content: `${selected ? '>' : ' '} ${choice.label}`,
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
