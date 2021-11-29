#!/usr/bin/env node

const chalk = require('chalk')
const { exec } = require('promisify-child-process')

async function main() {
  const goModTidyCmd = 'go mod tidy'
  console.log('\n', chalk.blue('Resolving go dependencies'), chalk.yellow(goModTidyCmd))
  try {
    let { stdout, stderr } = await exec(goModTidyCmd, {
      cwd: 'output/go',
    })
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
