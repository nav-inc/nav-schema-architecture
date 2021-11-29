const R = require('ramda')
const { readFileSync } = require('fs')
const console = require('console')

const fs = require('fs')
const path = require('path')
const { EOL } = require('os')

const env = (e, def) => R.pathOr(def, ['env', e], process)

const log = (ref, off = env('LOG_OFF', false)) => {
  !off && console.log(typeof ref === 'object' ? JSON.stringify(ref) : ref)
  return ref
}

const capitalize = (s) =>
  match(typeof s)
    .on('string', (t) => s.charAt(0).toUpperCase() + s.slice(1))
    .otherwise('')

const firstLowerCase = (s) =>
  match(typeof s)
    .on('string', (t) => s.charAt(0).toLowerCase() + s.slice(1))
    .otherwise('')

const firstUpperCase = (s) =>
  match(typeof s)
    .on('string', (t) => s.charAt(0).toUpperCase() + s.slice(1))
    .otherwise('')

const startsWithCapitalLetter = (word) => exists(word) && exists(word[0]) && word[0] === word[0].toUpperCase()

const startsWith = (str, c) => exists(str) && str.length > 0 && str[0] === c

const crlf = (idx, n) => (idx === (Array.isArray(n) ? n.length - 1 : n) ? '' : EOL)
const tab = (idx) => (idx < 1 ? '' : '\t')

const substringFrom = (start, str) => (isString(str) ? str.substring(start, str.length) : undefined)

const __ = (s) => (exists(s) && isString(s) ? s.split('-').join('_') : '')

const handleCapitalizedWords = (str) => {
  let out = ''
  if (str.length <= 3) return str
  let i = 0
  let padded = false
  if (str[str.length - 2] === '_') {
    str = `${str}_`
    padded = true
  }
  while (i < str.length - 3) {
    if (str[i] === '_' && str[i + 2] === '_') {
      const start = i
      let end = start + 2
      while (str[end] === '_' && str[end + 2] === '_') {
        end = end + 2
      }
      if (end > start + 2) {
        const fragment = str.substring(start, end + 1)
        out = out + '_' + fragment.split('_').join('') + '_'
        i = end
      } else {
        out = out + str[i]
      }
    } else {
      out = out + str[i]
    }
    i++
  }
  out = out + str.substring(i, str.length + 1)
  return match(padded)
    .on(true, out.substring(0, out.length - 1))
    .otherwise(out)
}

const processCameToSnake = (str) => {
  let i = 0
  let out = ''
  let lastUpperCaseStart = 0
  while (i < str.length) {
    if (`${str[i + 1]}`.match(/[A-Z]/) && !`${str[i]}`.match(/[A-Z]/g) && str[i] !== '_') {
      out = out + str[i] + '_'
      lastUpperCaseStart = i + 1
    } else {
      if (`${str[i]}`.match(/[A-Z]/) && `${str[i + 1]}`.match(/[a-z]/g) && i < str.length - 1 && i - lastUpperCaseStart > 1) {
        out = out + '_'
      }
      out = out + str[i]
    }
    i++
  }
  return out
}

const camelToSnakeCase = (str) => (str.length < 3 ? str : handleCapitalizedWords(processCameToSnake(str).toLowerCase()))

const isString = (str) => str && typeof str === 'string'

const isNotEmpty = (str) => R.not(R.isEmpty(str))

const foldObject = (prop1, prop2, obj) =>
  R.reduce(
    (acc, t) => {
      acc[t[prop1]] = t[prop2]
      return acc
    },
    {},
    obj
  )

const clone = (obj) => JSON.parse(JSON.stringify(obj))

const key = (r) => R.last(R.keys(r))

const valueForKey = (v) => v[key(v)]

const returnArray = (prop) => R.pathOr([], [prop])

const mapIndexed = R.addIndex(R.map)

const set = (arr, prop) =>
  match(prop)
    .on(exists, (prop) => {
      const uniqueSet = []
      const pivot = {}
      arr.forEach((i) => {
        if (R.isNil(pivot[i[prop]])) uniqueSet.push(i)
        pivot[i[prop]] = i
      })
      return uniqueSet
    })
    .otherwise([...new Set(arr)])

const exists = (t) => !R.isNil(t)

const propObject = (prop, obj) => ({ [prop]: obj })

const noNullElementArray = (a) => R.filter(exists, a)
const filter = (f = (exists) => R.filter(f))
const hasOneElement = (arr = []) => arr.length === 1

const splitByLast = (separator = '/', qualifiedName = '') =>
  match(qualifiedName.lastIndexOf(separator))
    .on((lastIndex) => lastIndex < 0, ['', qualifiedName])
    .otherwise((lastIndex) => [qualifiedName.substr(0, lastIndex), qualifiedName.substr(lastIndex + 1)])

const readJSONFileSync = (filename) => JSON.parse(readFileSync(process.cwd() + filename).toString())

const prepareFile = (f, outputDir, path, extension, code, messageDefinitionDir) => {
  f = match(messageDefinitionDir)
    .on(
      (d) => exists(d) && f.lastIndexOf(d) !== 0,
      (d) => d + '/' + f
    )
    .otherwise(f)

  const fileName = `${process.cwd()}/${R.replace(__(messageDefinitionDir), outputDir, R.head(R.split('.', __(f))))}`
  const p = fileName.lastIndexOf('/')
  return [
    fileName.substring(0, p) +
      (path ? '/' + camelToSnakeCase(__(path)) : '') +
      fileName.substring(p, fileName.length) +
      '.' +
      extension,
    code,
  ]
}

const writeFileSafe = (f, payload) => {
  ensureDirectoryExistence(f)
  fs.writeFileSync(f, payload)
}

function ensureDirectoryExistence(filePath) {
  match(path.dirname(filePath))
    .on(fs.existsSync, true)
    .otherwise((dirname) => {
      ensureDirectoryExistence(dirname)
      fs.mkdirSync(dirname)
    })
}

const cdw = (d) => `${process.cwd()}${startsWith(d, '/') ? '' : '/'}${d}`

const fromFile = (f) => fs.readFileSync(f).toString()

const filesFromDir = (directory, ext = []) => {
  const files = []
  walkDirSync(directory, (f) => {
    const hasExt = ext.length === 0 || ext.includes(R.last(f.split('.')))
    if (hasExt) files.push(f)
  })
  return files
}

const walkDirSync = (dir, callback) => {
  const files = fs.readdirSync(dir)
  R.forEach((file) => {
    let filepath = path.join(dir, file)
    match(fs.statSync(filepath))
      .on(
        (stats) => stats.isDirectory(),
        () => {
          walkDirSync(filepath, callback)
        }
      )
      .on(
        (stats) => stats.isFile(),
        (stats) => {
          callback(filepath, stats)
        }
      )
  }, files)
}

const filesWithExtension = (extension, files) => R.filter((f) => R.path(['extension'], f) === extension, files)

const cp = (fromDir, toDir) => {
  if (exists(fromDir) && exists(toDir)) {
    const files = filesFromDir(cdw(fromDir))
    files.forEach((f) => {
      const content = fromFile(f)
      const targetName = R.replace(fromDir, toDir, f)
      fs.writeFileSync(targetName, content)
    })
  }
}

// Adapted from
// and credits to https://codeburst.io/alternative-to-javascripts-switch-statement-with-a-functional-twist-3f572787ba1c

const matched = (x) => ({
  on: () => matched(x),
  otherwise: () => x,
})

const match = (...x) => ({
  on: (pred, fn) => {
    const _pred = typeof pred !== 'function' ? (z) => z === pred : pred
    const _fn = typeof fn !== 'function' ? () => fn : fn
    return _pred(...x) ? matched(_fn(...x)) : match(...x)
  },
  otherwise: (fn) => (fn === undefined ? x[0] : typeof fn !== 'function' ? fn : fn(...x)),
})

const matchReduce = (...x) => ({
  on: (pred, fn) => {
    const _pred = typeof pred !== 'function' ? (z) => z === pred : pred
    const _fn = typeof fn !== 'function' ? () => fn : fn
    return _pred(...x) ? matchReduce(_fn(...x)) : matchReduce(...x)
  },
  end: () => (x.length > 1 ? x : R.head(x)),
})

module.exports = {
  env,
  log,
  exists,
  noNullElementArray,
  hasOneElement,
  capitalize,
  startsWithCapitalLetter,
  firstLowerCase,
  firstUpperCase,
  crlf,
  tab,
  substringFrom,
  splitByLast,
  isString,
  __,
  handleCapitalizedWords,
  processCameToSnake,
  camelToSnakeCase,
  readJSONFileSync,
  filesFromDir,
  cdw,
  walkDirSync,
  ensureDirectoryExistence,
  writeFileSafe,
  fromFile,
  filesWithExtension,
  cp,
  clone,
  foldObject,
  returnArray,
  set,
  propObject,
  filter,
  mapIndexed,
  key,
  valueForKey,
  prepareFile,
  match,
  isNotEmpty,
  matchReduce,
}
