#!/usr/bin/env node

const chalk = require('chalk')
const { exec } = require('promisify-child-process')

async function main() {
  const generatePkgCommand = 'find ./output/python/nsa -type d -exec touch {}/__init__.py \\;'
  console.log('\n', chalk.blue('Creating __init__.py files for python packages'), chalk.yellow(generatePkgCommand))
  try {
    let { stdout, stderr } = await exec(generatePkgCommand)
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
