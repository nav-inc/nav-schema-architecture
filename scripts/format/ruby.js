#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')

async function main() {
  const rubocopCmd = 'rubocop -AD --format simple ./output/ruby/'
  console.log('\n', chalk.blue('Formatting ruby output'), chalk.yellow(rubocopCmd))
  try {
    const { stdout, stderr } = await spawn(rubocopCmd.split(' ')[0], rubocopCmd.split(' ').slice(1), {
      encoding: 'utf8',
      maxBuffer: 1024 * 1000,
    })
    console.log(stdout)
    console.log(stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
