import { getProblemById } from '../services/problemService'
import type { NavigationState, StudyChoice } from '../types/navigation'
import { truncateLine } from '../utils/text'
import { createTextObjects } from './g2Layout'

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
        y: 24,
        name: 'study-question-title',
        content: 'STUDY',
        textColor: 4,
        isEventCapture: true,
      },
      {
        y: 74,
        name: 'study-question-empty',
        content: 'No question available.',
        textColor: 3,
      },
    ])
  }

  const choiceY = 104

  return createTextObjects([
    {
      y: 14,
      height: 26,
      name: 'study-question-title',
      content: truncateLine(`#${problem.id} ${problem.title.toUpperCase()}`, 31),
      textColor: 4,
    },
    {
      y: 60,
      height: 24,
      name: 'study-question-label',
      content: getQuestionLabel(state),
      textColor: 3,
    },
    ...choices.map((choice, index) => {
      const selected = index === selectedIndex

      return {
        x: 50,
        y: choiceY + index * 34,
        width: 470,
        height: 26,
        name: `study-choice-${index}`,
        content: `${selected ? '>' : ' '} ${truncateLine(choice.label, 31)}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
