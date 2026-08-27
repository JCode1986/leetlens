import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MIN_PROBLEM_COUNT = 75
const BLIND_75_COLLECTION_NAME = 'Blind 75'
const BLIND_75_COUNT = 75
const MAX_G2_LINE_LENGTH = 32
const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard'])
const REQUIRED_LANGUAGES = ['javascript', 'python', 'java', 'cpp']

const root = process.cwd()
const problemsDir = join(root, 'src', 'data', 'problems')
const categoriesPath = join(root, 'src', 'data', 'categories.json')
const patternsPath = join(root, 'src', 'data', 'patterns.json')
const collectionsPath = join(root, 'src', 'data', 'collections.json')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function fail(message) {
  throw new Error(message)
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
}

function assertString(value, label) {
  assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a non-empty string.`)
}

function assertStringArray(value, label) {
  assert(Array.isArray(value), `${label} must be an array.`)
  assert(value.every((item) => typeof item === 'string' && item.trim().length > 0), `${label} must contain only non-empty strings.`)
}

function assertNumberArray(value, label) {
  assert(Array.isArray(value), `${label} must be an array.`)
  assert(value.every((item) => Number.isInteger(item)), `${label} must contain only integer problem IDs.`)
}

function assertLineArray(value, label) {
  assert(Array.isArray(value) && value.length > 0, `${label} must be a non-empty array.`)
  assert(value.every((line) => typeof line === 'string'), `${label} must contain only strings.`)
}

function assertNoSolutionPlaceholders(lines, label) {
  const text = lines.join('\n').toLowerCase()
  const placeholderMarkers = [
    'follow the approach notes',
    'return input',
    'todo',
  ]

  for (const marker of placeholderMarkers) {
    assert(!text.includes(marker), `${label} contains placeholder marker "${marker}".`)
  }
}

function assertIndex(name, index) {
  assert(index && typeof index === 'object' && !Array.isArray(index), `${name} must be an object.`)

  for (const [key, problemIds] of Object.entries(index)) {
    assertString(key, `${name} key`)
    assertNumberArray(problemIds, `${name}.${key}`)
  }
}

const problemFiles = readdirSync(problemsDir)
  .filter((fileName) => fileName.endsWith('.json'))
  .sort()

assert(
  problemFiles.length >= MIN_PROBLEM_COUNT,
  `Expected at least ${MIN_PROBLEM_COUNT} canonical problems, found ${problemFiles.length}.`,
)

const problems = problemFiles.map((fileName) => ({
  fileName,
  data: readJson(join(problemsDir, fileName)),
}))

const categories = readJson(categoriesPath)
const patterns = readJson(patternsPath)
const collections = readJson(collectionsPath)

assertIndex('categories', categories)
assertIndex('patterns', patterns)
assertIndex('collections', collections)

const ids = new Set()
const slugs = new Set()
const g2Warnings = []
const g2IndentWarnings = []
const pseudocodeIndentWarnings = []

function indentationOf(line) {
  return line.match(/^ */)?.[0].length ?? 0
}

function collectIndentationWarnings(problem, language, lines) {
  const warnings = []
  let previous = undefined

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (trimmed.length === 0) {
      return
    }

    if (previous) {
      const currentIndent = indentationOf(line)

      if (language === 'python') {
        if (previous.text.endsWith(':') && currentIndent <= previous.indent) {
          warnings.push({
            problem,
            language,
            lineNumber: index + 1,
            message: 'Expected indentation after ":".',
          })
        }
      } else if (
        previous.text.endsWith('{') &&
        !trimmed.startsWith('}') &&
        !(language === 'cpp' && /^(public|private|protected):$/.test(trimmed))
      ) {
        if (currentIndent <= previous.indent) {
          warnings.push({
            problem,
            language,
            lineNumber: index + 1,
            message: 'Expected deeper indentation after "{".',
          })
        }
      }
    }

    previous = {
      text: trimmed,
      indent: indentationOf(line),
    }
  })

  return warnings
}

function collectPseudocodeIndentationWarnings(problem, lines) {
  const warnings = []
  let previous = undefined

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (trimmed.length === 0) {
      return
    }

    if (previous && previous.text.endsWith(':')) {
      const currentIndent = indentationOf(line)

      if (currentIndent <= previous.indent) {
        warnings.push({
          problem,
          lineNumber: index + 1,
          message: 'Expected indentation after ":".',
        })
      }
    }

    previous = {
      text: trimmed,
      indent: indentationOf(line),
    }
  })

  return warnings
}

for (const { fileName, data: problem } of problems) {
  const label = `${fileName} (#${problem.id ?? 'unknown'})`

  assert(Number.isInteger(problem.id), `${label} id must be an integer.`)
  assert(!ids.has(problem.id), `${label} duplicates problem ID ${problem.id}.`)
  ids.add(problem.id)

  assertString(problem.slug, `${label} slug`)
  assert(!slugs.has(problem.slug), `${label} duplicates slug "${problem.slug}".`)
  slugs.add(problem.slug)

  assertString(problem.title, `${label} title`)
  assert(VALID_DIFFICULTIES.has(problem.difficulty), `${label} has invalid difficulty "${problem.difficulty}".`)
  assertStringArray(problem.categories, `${label} categories`)
  assertStringArray(problem.patterns, `${label} patterns`)
  assertStringArray(problem.aliases, `${label} aliases`)
  assertStringArray(problem.keywords, `${label} keywords`)
  assertString(problem.summary, `${label} summary`)
  assertString(problem.hint, `${label} hint`)
  assert(problem.quickAnswer && typeof problem.quickAnswer === 'object', `${label} quickAnswer is required.`)
  assertString(problem.quickAnswer.pattern, `${label} quickAnswer.pattern`)
  assertStringArray(problem.quickAnswer.idea, `${label} quickAnswer.idea`)
  assert(problem.quickAnswer.complexity && typeof problem.quickAnswer.complexity === 'object', `${label} quickAnswer.complexity is required.`)
  assertString(problem.quickAnswer.complexity.time, `${label} quickAnswer.complexity.time`)
  assertString(problem.quickAnswer.complexity.space, `${label} quickAnswer.complexity.space`)
  assertStringArray(problem.approach, `${label} approach`)
  assertLineArray(problem.pseudocode, `${label} pseudocode`)
  assertStringArray(problem.edgeCases, `${label} edgeCases`)

  pseudocodeIndentWarnings.push(
    ...collectPseudocodeIndentationWarnings(
      `${problem.id} ${problem.title}`,
      problem.pseudocode,
    ),
  )

  assert(problem.complexity && typeof problem.complexity === 'object', `${label} complexity is required.`)
  assertString(problem.complexity.time, `${label} complexity.time`)
  assertString(problem.complexity.space, `${label} complexity.space`)

  assert(problem.solutions && typeof problem.solutions === 'object', `${label} solutions are required.`)
  for (const language of REQUIRED_LANGUAGES) {
    const solution = problem.solutions[language]
    assert(solution && typeof solution === 'object', `${label} missing ${language} solution.`)
    assertLineArray(solution.desktop, `${label} ${language}.desktop`)
    assertLineArray(solution.g2, `${label} ${language}.g2`)
    assertNoSolutionPlaceholders(solution.desktop, `${label} ${language}.desktop`)
    assertNoSolutionPlaceholders(solution.g2, `${label} ${language}.g2`)

    solution.g2.forEach((line, index) => {
      if (line.length > MAX_G2_LINE_LENGTH) {
        g2Warnings.push({
          problem: `${problem.id} ${problem.title}`,
          language,
          lineNumber: index + 1,
          length: line.length,
        })
      }
    })

    g2IndentWarnings.push(
      ...collectIndentationWarnings(
        `${problem.id} ${problem.title}`,
        language,
        solution.g2,
      ),
    )
  }

  for (const category of problem.categories) {
    assert(Object.hasOwn(categories, category), `${label} references unknown category "${category}".`)
    assert(categories[category].includes(problem.id), `${label} category "${category}" does not list problem ${problem.id}.`)
  }

  for (const pattern of problem.patterns) {
    assert(Object.hasOwn(patterns, pattern), `${label} references unknown pattern "${pattern}".`)
    assert(patterns[pattern].includes(problem.id), `${label} pattern "${pattern}" does not list problem ${problem.id}.`)
  }
}

function assertKnownReferences(name, index) {
  for (const [key, problemIds] of Object.entries(index)) {
    for (const problemId of problemIds) {
      assert(ids.has(problemId), `${name} "${key}" references unknown problem ID ${problemId}.`)
    }
  }
}

assertKnownReferences('Category', categories)
assertKnownReferences('Pattern', patterns)
assertKnownReferences('Collection', collections)

const blind75 = collections[BLIND_75_COLLECTION_NAME]
assert(Array.isArray(blind75), `${BLIND_75_COLLECTION_NAME} collection is required.`)
assert(blind75.length === BLIND_75_COUNT, `${BLIND_75_COLLECTION_NAME} must contain exactly ${BLIND_75_COUNT} IDs, found ${blind75.length}.`)
assert(new Set(blind75).size === BLIND_75_COUNT, `${BLIND_75_COLLECTION_NAME} contains duplicate IDs.`)
for (const problemId of blind75) {
  assert(ids.has(problemId), `${BLIND_75_COLLECTION_NAME} references unknown problem ID ${problemId}.`)
}

console.log(`TOTAL PROBLEMS: ${problemFiles.length}`)
console.log(`BLIND 75 COUNT: ${blind75.length}`)
console.log(`LANGUAGE COVERAGE: ${REQUIRED_LANGUAGES.join(', ')}`)

if (g2Warnings.length > 0) {
  console.warn(`G2 LINE WARNINGS: ${g2Warnings.length} lines exceed ${MAX_G2_LINE_LENGTH} characters.`)
  for (const warning of g2Warnings.slice(0, 100)) {
    console.warn(
      `- #${warning.problem} ${warning.language} line ${warning.lineNumber}: ${warning.length} chars`,
    )
  }
  if (g2Warnings.length > 100) {
    console.warn(`- ${g2Warnings.length - 100} additional G2 line warnings omitted.`)
  }
} else {
  console.log('G2 LINE WARNINGS: 0')
}

if (g2IndentWarnings.length > 0) {
  console.warn(`G2 INDENTATION WARNINGS: ${g2IndentWarnings.length}`)
  for (const warning of g2IndentWarnings.slice(0, 100)) {
    console.warn(
      `- #${warning.problem} ${warning.language} line ${warning.lineNumber}: ${warning.message}`,
    )
  }
  if (g2IndentWarnings.length > 100) {
    console.warn(`- ${g2IndentWarnings.length - 100} additional G2 indentation warnings omitted.`)
  }
} else {
  console.log('G2 INDENTATION WARNINGS: 0')
}

if (pseudocodeIndentWarnings.length > 0) {
  console.warn(`PSEUDOCODE INDENTATION WARNINGS: ${pseudocodeIndentWarnings.length}`)
  for (const warning of pseudocodeIndentWarnings.slice(0, 100)) {
    console.warn(
      `- #${warning.problem} line ${warning.lineNumber}: ${warning.message}`,
    )
  }
  if (pseudocodeIndentWarnings.length > 100) {
    console.warn(`- ${pseudocodeIndentWarnings.length - 100} additional pseudocode indentation warnings omitted.`)
  }
} else {
  console.log('PSEUDOCODE INDENTATION WARNINGS: 0')
}
