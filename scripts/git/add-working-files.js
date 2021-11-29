#!/usr/bin/env node

const chalk = require('chalk')
const { exec } = require('promisify-child-process')

async function main() {
  const gitCmd = 'git add output/ CHANGELOG.md --force'
  console.log('\n', chalk.blue('Staging files'), '\n', chalk.yellow(gitCmd))

  try {
    const { stdout, stderr } = await exec(gitCmd)
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
