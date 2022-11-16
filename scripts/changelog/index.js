#!/usr/bin/env node

const chalk = require('chalk')
const changelog = require('generate-changelog')
const prepend = require('prepend-file')

async function main() {
  console.log('\n', chalk.blue('Generating changelog'))

  const changes = await changelog.generate({
    patch: true,
    allowUnknown: true,
  })

  try {
    await prepend('CHANGELOG.md', changes)
  } catch (e) {
    console.error(chalk.red(e))
    throw e
  }

  console.log('\n', chalk.green('Changelog saved to CHANGELOG.md'))
}

if (!module.parent) main()

module.exports = main
