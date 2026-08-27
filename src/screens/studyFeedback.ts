import { getProblemById } from '../services/problemService'
import type { NavigationState, StudyChoice } from '../types/navigation'
import { wrapParagraph } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import { createTextObjects, G2_TEXT_LAYOUT, getCenteredTextGeometry } from './g2Layout'

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
  const problemLines = wrapParagraph(problemLabel, G2_TEXT_LAYOUT.proseCharsPerLine).slice(0, 2)
  const answerLines = wrapParagraph(answerLabel, G2_TEXT_LAYOUT.proseCharsPerLine).slice(0, 2)
  const actionStartY = 136
  const visibleActions = getVisibleWindow(actions, selectedIndex, 4)
  const actionGeometry = getCenteredTextGeometry(
    actions.map((action) => `> ${action}`),
    160,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...getCenteredTextGeometry(state.studyCorrect ? 'CORRECT' : 'NOT QUITE'),
      y: 14,
      height: 24,
      name: 'study-feedback-title',
      content: state.studyCorrect ? 'CORRECT' : 'NOT QUITE',
      textColor: 4,
    },
    {
      ...getCenteredTextGeometry(problemLines),
      y: 42,
      height: 48,
      name: 'study-feedback-problem',
      content: problemLines.join('\n'),
      textColor: 3,
    },
    {
      ...getCenteredTextGeometry(answerLines),
      y: 78,
      height: 48,
      name: 'study-feedback-answer',
      content: answerLines.join('\n'),
      textColor: 4,
    },
    ...visibleActions.items.map((action, index) => {
      const actionIndex = visibleActions.startIndex + index
      const selected = actionIndex === selectedIndex

      return {
        x: actionGeometry.x,
        y: actionStartY + index * 34,
        width: actionGeometry.width,
        height: 26,
        name: `study-feedback-action-${actionIndex}`,
        content: `${selected ? '>' : ' '} ${action}`,
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
