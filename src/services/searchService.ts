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

interface SearchProblemIndex {
  problem: Problem
  title: string
  slug: string
  aliases: string[]
  keywords: string[]
  categories: string[]
  patterns: string[]
  titleTokens: Set<string>
  aliasTokenSets: Set<string>[]
  keywordTokenSets: Set<string>[]
  categoryTokenSets: Set<string>[]
  patternTokenSets: Set<string>[]
  metadataValues: string[]
}

interface SearchQueryIndex {
  normalized: string
  tokens: string[]
  spokenId: number | undefined
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

function tokenizeNormalized(value: string): string[] {
  return value.split(' ').filter(Boolean)
}

function createNormalizedTokenSet(value: string): Set<string> {
  return new Set(tokenizeNormalized(value))
}

function createSearchProblemIndex(problem: Problem): SearchProblemIndex {
  const title = normalizeText(problem.title)
  const slug = normalizeText(problem.slug)
  const aliases = (problem.aliases ?? []).map(normalizeText)
  const keywords = (problem.keywords ?? []).map(normalizeText)
  const categories = problem.categories.map(normalizeText)
  const patterns = problem.patterns.map(normalizeText)

  return {
    problem,
    title,
    slug,
    aliases,
    keywords,
    categories,
    patterns,
    titleTokens: createNormalizedTokenSet(title),
    aliasTokenSets: aliases.map(createNormalizedTokenSet),
    keywordTokenSets: keywords.map(createNormalizedTokenSet),
    categoryTokenSets: categories.map(createNormalizedTokenSet),
    patternTokenSets: patterns.map(createNormalizedTokenSet),
    metadataValues: [...categories, ...patterns, ...keywords],
  }
}

const SEARCH_INDEX = getAllProblems().map(createSearchProblemIndex)
const BROAD_METADATA_VALUES = new Set(SEARCH_INDEX.flatMap((problemIndex) =>
  problemIndex.metadataValues,
))

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))]
}

function parseNormalizedSpokenId(normalized: string): number | undefined {
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

function createSearchQueryIndex(query: string): SearchQueryIndex {
  const normalized = normalizeText(query)

  return {
    normalized,
    tokens: tokenizeNormalized(normalized),
    spokenId: parseNormalizedSpokenId(normalized),
  }
}

function tokenOverlapScore(
  queryTokens: string[],
  fieldTokens: Set<string>,
  pointsPerToken: number,
): number {
  let overlap = 0

  for (const token of queryTokens) {
    if (fieldTokens.has(token)) {
      overlap += 1
    }
  }

  return overlap * pointsPerToken
}

function maxTokenOverlapScore(
  queryTokens: string[],
  fieldTokenSets: Set<string>[],
  pointsPerToken: number,
): number {
  let maxScore = 0

  for (const fieldTokens of fieldTokenSets) {
    maxScore = Math.max(maxScore, tokenOverlapScore(queryTokens, fieldTokens, pointsPerToken))
  }

  return maxScore
}

function metadataScore(
  values: string[],
  tokenSets: Set<string>[],
  query: string,
  queryTokens: string[],
  exactOrPartialPoints: number,
  tokenPoints: number,
): number {
  return values.reduce((total, value, index) => {
    if (value === query || value.includes(query) || query.includes(value)) {
      return total + exactOrPartialPoints
    }

    return total + tokenOverlapScore(queryTokens, tokenSets[index], tokenPoints)
  }, 0)
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

function scoreProblem(index: SearchProblemIndex, queryIndex: SearchQueryIndex): RankedProblemMatch | undefined {
  const { problem } = index
  const query = queryIndex.normalized
  const queryTokens = queryIndex.tokens
  const queryId = queryIndex.spokenId
  const matchedFields: string[] = []
  let score = 0
  let matchType: ProblemMatchType = 'related'

  if (queryId === problem.id) {
    score += addFieldScore(matchedFields, 'id', 1000)
    matchType = 'exact'
  }

  if (query === index.title) {
    score += addFieldScore(matchedFields, 'title', 900)
    matchType = 'exact'
  } else if (index.title.startsWith(query)) {
    score += addFieldScore(matchedFields, 'title-prefix', 760)
    matchType = 'strong'
  } else if (index.title.includes(query)) {
    score += addFieldScore(matchedFields, 'title-contains', 700)
    matchType = 'strong'
  }

  if (index.aliases.includes(query)) {
    score += addFieldScore(matchedFields, 'alias', 860)
    matchType = 'exact'
  } else if (index.aliases.some((alias) => alias.includes(query) || query.includes(alias))) {
    score += addFieldScore(matchedFields, 'alias-partial', 620)
    matchType = matchType === 'exact' ? matchType : 'strong'
  }

  if (index.slug.includes(query)) {
    score += addFieldScore(matchedFields, 'slug', 560)
    matchType = matchType === 'exact' ? matchType : 'strong'
  }

  score += addFieldScore(matchedFields, 'title-tokens', tokenOverlapScore(queryTokens, index.titleTokens, 95))

  const aliasTokenScore = maxTokenOverlapScore(queryTokens, index.aliasTokenSets, 85)
  score += addFieldScore(matchedFields, 'alias-tokens', aliasTokenScore)

  const keywordScore = metadataScore(index.keywords, index.keywordTokenSets, query, queryTokens, 120, 55)
  score += addFieldScore(matchedFields, 'keywords', keywordScore)

  const categoryScore = metadataScore(index.categories, index.categoryTokenSets, query, queryTokens, 110, 45)
  score += addFieldScore(matchedFields, 'categories', categoryScore)

  const patternScore = metadataScore(index.patterns, index.patternTokenSets, query, queryTokens, 125, 50)
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

function isBroadMetadataQuery(normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return false
  }

  return BROAD_METADATA_VALUES.has(normalizedQuery)
}

function searchProblems(queryIndex: SearchQueryIndex): RankedProblemMatch[] {
  if (queryIndex.normalized.length === 0) {
    return []
  }

  return SEARCH_INDEX
    .map((problem) => scoreProblem(problem, queryIndex))
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
  const queryIndex = createSearchQueryIndex(query)

  if (queryIndex.normalized.length === 0) {
    return {
      kind: 'empty',
      query,
      matches: [],
    }
  }

  const matches = searchProblems(queryIndex)
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
  const broadMetadataQuery = isBroadMetadataQuery(queryIndex.normalized)
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
