import { getProblemById } from '../services/problemService'
import type { NavigationState, StudyChoice } from '../types/navigation'
import { wrapParagraph } from '../utils/text'
import { getVisibleWindow } from '../utils/visibleWindow'
import {
  centerContentInPaddedScreen,
  centerTitleContentInPaddedScreen,
  createTextObjects,
  G2_TEXT_LAYOUT,
  getNavigableTextGeometry,
  getPaddedScreenTextGeometry,
} from './g2Layout'

const FEEDBACK_TITLE_Y = 14
const FEEDBACK_PROBLEM_Y = 44
const FEEDBACK_LINE_HEIGHT = 26
const FEEDBACK_BLOCK_GAP = 8
const FEEDBACK_ACTION_GAP = 14
const FEEDBACK_ACTION_ROW_HEIGHT = 30

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
  const problemLines = wrapParagraph(
    problemLabel,
    G2_TEXT_LAYOUT.maxCenteredContentCharsPerLine,
  ).slice(0, 2)
  const answerY = FEEDBACK_PROBLEM_Y + problemLines.length * FEEDBACK_LINE_HEIGHT + FEEDBACK_BLOCK_GAP
  const answerLines = wrapParagraph(
    answerLabel,
    G2_TEXT_LAYOUT.maxCenteredContentCharsPerLine,
  ).slice(0, 2)
  const actionStartY = answerY + answerLines.length * FEEDBACK_LINE_HEIGHT + FEEDBACK_ACTION_GAP
  const visibleActions = getVisibleWindow(actions, selectedIndex, 4)
  const actionGeometry = getNavigableTextGeometry(
    actions.map((action) => `> ${action}`),
    160,
    G2_TEXT_LAYOUT.listItemWidth,
  )

  return createTextObjects([
    {
      ...getPaddedScreenTextGeometry(),
      y: FEEDBACK_TITLE_Y,
      height: 24,
      name: 'study-feedback-title',
      content: centerTitleContentInPaddedScreen(state.studyCorrect ? 'CORRECT' : 'NOT QUITE'),
      textColor: 4,
    },
    {
      ...getPaddedScreenTextGeometry(),
      y: FEEDBACK_PROBLEM_Y,
      height: problemLines.length * FEEDBACK_LINE_HEIGHT,
      name: 'study-feedback-problem',
      content: centerContentInPaddedScreen(problemLines),
      textColor: 3,
    },
    {
      ...getPaddedScreenTextGeometry(),
      y: answerY,
      height: answerLines.length * FEEDBACK_LINE_HEIGHT,
      name: 'study-feedback-answer',
      content: centerContentInPaddedScreen(answerLines),
      textColor: 4,
    },
    ...visibleActions.items.map((action, index) => {
      const actionIndex = visibleActions.startIndex + index
      const selected = actionIndex === selectedIndex

      return {
        x: actionGeometry.x,
        y: actionStartY + index * FEEDBACK_ACTION_ROW_HEIGHT,
        width: actionGeometry.width,
        height: 26,
        name: `study-feedback-action-${actionIndex}`,
        content: `${selected ? '>' : ' '} ${action}`,
        textColor: selected ? 4 : 3,
      }
    }),
  ])
}
