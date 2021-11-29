#!/usr/bin/env node

const chalk = require('chalk')
const cleanOutput = require('../clean-output')
const parse = require('../../src/index')
const pythonPackages = require('../python/packages')
const goimports = require('../format/go')
const gomod = require('../format/go-mod')
const rubocop = require('../format/ruby')
const yapf = require('../format/python')

async function main() {
  console.log('\n', chalk.blue('Generating and formatting output schemas'))
  try {
    await cleanOutput()
    await Promise.resolve(parse())
    await pythonPackages()
    await goimports()
    await gomod()
    await rubocop()
    await yapf()
  } catch (e) {
    console.error(chalk.red(e))
    process.exit(1)
  }
}

if (!module.parent) main()

module.exports = main
