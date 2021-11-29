#!/usr/bin/env node

const chalk = require('chalk')
const bumpRuby = require('../bump/ruby')
const bumpPython = require('../bump/python')
const generateChangelog = require('../changelog')
const { IS_VERSION_ALLOWED } = process.env

async function main() {
  if (!IS_VERSION_ALLOWED) {
    console.error(chalk.red('Error: environment settings indicate that versioning is not allowed'))
    process.exit(1)
  }
  try {
    await bumpRuby()
    await bumpPython()
    await generateChangelog()
  } catch (e) {
    console.error(chalk.red(e))
    process.exit(1)
  }
}

if (!module.parent) main()

module.exports = main
