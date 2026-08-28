import { getAllProblems } from './problemService'
import type { Problem } from '../types/problem'

const MATCH_THRESHOLDS = {
  highConfidence: 700,
  likely: 420,
  related: 120,
  clearLeadMargin: 180,
  closeResultGap: 140,
} as const

type ProblemMatchType = 'exact' | 'strong' | 'related'

interface RankedProblemMatch {
  problem: Problem
  score: number
  matchType: ProblemMatchType
  matchedFields: string[]
}

export type SearchDecision =
  | { kind: 'empty'; query: string; matches: [] }
  | { kind: 'exact'; query: string; matches: [RankedProblemMatch, ...RankedProblemMatch[]] }
  | { kind: 'possible'; query: string; matches: RankedProblemMatch[] }
  | { kind: 'related'; query: string; matches: RankedProblemMatch[] }
  | { kind: 'none'; query: string; matches: [] }

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
}

const QUERY_ID_PREFIXES = new Set(['problem', 'number', 'leetcode', 'leet', 'code'])

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/#/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(' ').filter(Boolean)
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))]
}

function parseSpokenId(query: string): number | undefined {
  const normalized = normalizeText(query)

  if (normalized.length === 0) {
    return undefined
  }

  const numeric = normalized.match(/(?:^|\s)(?:problem|number|leetcode|leet code)?\s*(\d+)(?:\s|$)/)

  if (numeric?.[1]) {
    return Number(numeric[1])
  }

  const tokens = normalized.split(' ')
  const meaningfulTokens = tokens.filter((token) => !QUERY_ID_PREFIXES.has(token))

  if (meaningfulTokens.length === 1) {
    return NUMBER_WORDS[meaningfulTokens[0]]
  }

  return undefined
}

function tokenOverlapScore(queryTokens: string[], field: string, pointsPerToken: number): number {
  const fieldTokens = new Set(tokenize(field))
  const overlap = queryTokens.filter((token) => fieldTokens.has(token)).length

  return overlap * pointsPerToken
}

function addFieldScore(
  matchedFields: string[],
  fieldName: string,
  score: number,
): number {
  if (score > 0) {
    matchedFields.push(fieldName)
  }

  return score
}

function scoreProblem(problem: Problem, rawQuery: string): RankedProblemMatch | undefined {
  const query = normalizeText(rawQuery)
  const queryTokens = tokenize(rawQuery)
  const queryId = parseSpokenId(rawQuery)
  const title = normalizeText(problem.title)
  const slug = normalizeText(problem.slug)
  const aliases = (problem.aliases ?? []).map(normalizeText)
  const keywords = (problem.keywords ?? []).map(normalizeText)
  const categories = problem.categories.map(normalizeText)
  const patterns = problem.patterns.map(normalizeText)
  const matchedFields: string[] = []
  let score = 0
  let matchType: ProblemMatchType = 'related'

  if (queryId === problem.id) {
    score += addFieldScore(matchedFields, 'id', 1000)
    matchType = 'exact'
  }

  if (query === title) {
    score += addFieldScore(matchedFields, 'title', 900)
    matchType = 'exact'
  } else if (title.startsWith(query)) {
    score += addFieldScore(matchedFields, 'title-prefix', 760)
    matchType = 'strong'
  } else if (title.includes(query)) {
    score += addFieldScore(matchedFields, 'title-contains', 700)
    matchType = 'strong'
  }

  if (aliases.includes(query)) {
    score += addFieldScore(matchedFields, 'alias', 860)
    matchType = 'exact'
  } else if (aliases.some((alias) => alias.includes(query) || query.includes(alias))) {
    score += addFieldScore(matchedFields, 'alias-partial', 620)
    matchType = matchType === 'exact' ? matchType : 'strong'
  }

  if (slug.includes(query)) {
    score += addFieldScore(matchedFields, 'slug', 560)
    matchType = matchType === 'exact' ? matchType : 'strong'
  }

  score += addFieldScore(matchedFields, 'title-tokens', tokenOverlapScore(queryTokens, problem.title, 95))

  const aliasTokenScore = Math.max(
    0,
    ...aliases.map((alias) => tokenOverlapScore(queryTokens, alias, 85)),
  )
  score += addFieldScore(matchedFields, 'alias-tokens', aliasTokenScore)

  const keywordScore = keywords.reduce((total, keyword) => {
    if (keyword === query || keyword.includes(query) || query.includes(keyword)) {
      return total + 120
    }

    return total + tokenOverlapScore(queryTokens, keyword, 55)
  }, 0)
  score += addFieldScore(matchedFields, 'keywords', keywordScore)

  const categoryScore = categories.reduce((total, category) => {
    if (category === query || category.includes(query) || query.includes(category)) {
      return total + 110
    }

    return total + tokenOverlapScore(queryTokens, category, 45)
  }, 0)
  score += addFieldScore(matchedFields, 'categories', categoryScore)

  const patternScore = patterns.reduce((total, pattern) => {
    if (pattern === query || pattern.includes(query) || query.includes(pattern)) {
      return total + 125
    }

    return total + tokenOverlapScore(queryTokens, pattern, 50)
  }, 0)
  score += addFieldScore(matchedFields, 'patterns', patternScore)

  if (score <= 0) {
    return undefined
  }

  if (matchType !== 'exact' && score >= MATCH_THRESHOLDS.likely) {
    matchType = 'strong'
  }

  return {
    problem,
    score,
    matchType,
    matchedFields: uniqueValues(matchedFields),
  }
}

function isBroadMetadataQuery(query: string, problems: Problem[]): boolean {
  const normalized = normalizeText(query)

  if (normalized.length === 0) {
    return false
  }

  return problems.some((problem) => {
    const metadata = [
      ...problem.categories,
      ...problem.patterns,
      ...(problem.keywords ?? []),
    ].map(normalizeText)

    return metadata.some((value) => value === normalized)
  })
}

function searchProblems(query: string, problems: Problem[]): RankedProblemMatch[] {
  const normalized = normalizeText(query)

  if (normalized.length === 0) {
    return []
  }

  return problems
    .map((problem) => scoreProblem(problem, query))
    .filter((match): match is RankedProblemMatch => match !== undefined)
    .filter((match) => match.score >= MATCH_THRESHOLDS.related)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      return a.problem.id - b.problem.id
    })
}

export function decideSearchResult(query: string): SearchDecision {
  const normalized = normalizeText(query)

  if (normalized.length === 0) {
    return {
      kind: 'empty',
      query,
      matches: [],
    }
  }

  const problems = getAllProblems()
  const matches = searchProblems(query, problems)
  const top = matches[0]

  if (!top) {
    return {
      kind: 'none',
      query,
      matches: [],
    }
  }

  const next = matches[1]
  const clearLead = !next || top.score - next.score >= MATCH_THRESHOLDS.clearLeadMargin
  const broadMetadataQuery = isBroadMetadataQuery(query, problems)
  const highConfidence = top.matchType === 'exact' ||
    (top.score >= MATCH_THRESHOLDS.highConfidence && clearLead && !broadMetadataQuery)

  if (highConfidence) {
    return {
      kind: 'exact',
      query,
      matches: matches as [RankedProblemMatch, ...RankedProblemMatch[]],
    }
  }

  const closeStrongMatches = matches.filter(
    (match) =>
      match.score >= MATCH_THRESHOLDS.likely &&
      top.score - match.score <= MATCH_THRESHOLDS.closeResultGap,
  )

  if (!broadMetadataQuery && (closeStrongMatches.length > 1 || top.score >= MATCH_THRESHOLDS.likely)) {
    return {
      kind: 'possible',
      query,
      matches,
    }
  }

  return {
    kind: 'related',
    query,
    matches,
  }
}
