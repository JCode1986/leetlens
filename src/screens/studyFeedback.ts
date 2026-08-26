import { getProblemById } from '../services/problemService'
import type { NavigationState, StudyChoice } from '../types/navigation'
import { truncateLine } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects } from './g2Layout'

function getCorrectChoice(choices: StudyChoice[]): StudyChoice | undefined {
  return choices.find((choice) => choice.isCorrect)
}

function getFeedbackActions(state: NavigationState): string[] {
  if (state.studyCorrect) {
    return ['Quick Answer', 'Pseudocode', 'Solution', 'Next Problem']
  }

  return ['Why?', 'Quick Answer', 'Next Problem']
}

export function createStudyFeedbackTextObjects(state: NavigationState) {
  const problemId = state.studyProblemId ?? state.selectedProblemId
  const problem = problemId === undefined ? undefined : getProblemById(problemId)
  const correctChoice = getCorrectChoice(state.studyChoices)
  const actions = getFeedbackActions(state)
  const selectedIndex = Math.max(0, Math.min(actions.length - 1, state.studySelectedIndex))
  const problemLabel = problem ? `#${problem.id} ${problem.title}` : 'Problem unavailable'
  const answerLabel = state.studyCorrect
    ? correctChoice?.label ?? 'Answer unavailable'
    : `Correct: ${correctChoice?.label ?? 'Unavailable'}`
  const actionStartY = 116
  const visibleActions = getVisibleWindow(actions, selectedIndex, 4)

  return createTextObjects([
    {
      y: 14,
      height: 24,
      name: 'study-feedback-title',
      content: state.studyCorrect ? 'CORRECT' : 'NOT QUITE',
      textColor: 4,
    },
    {
      y: 42,
      height: 24,
      name: 'study-feedback-problem',
      content: truncateLine(problemLabel, 31),
      textColor: 3,
    },
    {
      y: 76,
      height: 24,
      name: 'study-feedback-answer',
      content: truncateLine(answerLabel, 31),
      textColor: 4,
    },
    ...visibleActions.items.map((action, index) => {
      const actionIndex = visibleActions.startIndex + index
      const selected = actionIndex === selectedIndex

      return {
        x: 50,
        y: actionStartY + index * 34,
        width: 470,
        height: 26,
        name: `study-feedback-action-${actionIndex}`,
        content: `${selected ? '>' : ' '} ${action}`,
        textColor: selected ? 4 : 3,
        isEventCapture: selected,
      }
    }),
  ])
}
