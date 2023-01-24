#!/usr/bin/env node

const chalk = require('chalk')
const addWorkingFiles = require('../git/add-working-files')
const commit = require('../git/commit')
const pushFiles = require('../git/push-files')
const generate = require('./generate')

async function main() {
  console.log('\n', chalk.blue('Generating and formatting output schemas'))
  try {
    await generate()
    await addWorkingFiles()
    await commit()
    await pushFiles()
  } catch (e) {
    console.error(chalk.red(e))
    process.exit(1)
  }
}

if (!module.parent) main()

module.exports = main
