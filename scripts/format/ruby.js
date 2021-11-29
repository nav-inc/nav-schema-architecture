#!/usr/bin/env node

const chalk = require('chalk')
const { exec } = require('promisify-child-process')

async function main() {
  const rubocopCmd = 'rubocop -AD ./output/ruby/ --format quiet'
  console.log('\n', chalk.blue('Formatting ruby output'), chalk.yellow(rubocopCmd))
  try {
    let { stdout, stderr } = await exec(rubocopCmd)
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
