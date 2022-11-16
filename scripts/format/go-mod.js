#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')

async function main() {
  const goModTidyCmd = 'go mod tidy'
  console.log('\n', chalk.blue('Resolving go dependencies'), chalk.yellow(goModTidyCmd))
  try {
    const { stdout, stderr } = await spawn(goModTidyCmd.split(' ')[0], goModTidyCmd.split(' ').slice(1), {
      cwd: 'output/go',
      encoding: 'utf8',
    })
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
