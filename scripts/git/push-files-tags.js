#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')

async function main() {
  const gitCmd = 'git push'
  const gitTagCmd = 'git push --tags'
  console.log('\n', 'Pushing commits and tags', chalk.yellow(gitCmd), chalk.yellow(gitTagCmd))

  try {
    let stdout, stderr
    ;({ stdout, stderr } = await spawn(gitCmd.split(' ')[0], gitCmd.split(' ').slice(1), { encoding: 'utf8' }))
    console.log(stdout, stderr)
    ;({ stdout, stderr } = await spawn(gitTagCmd.split(' ')[0], gitTagCmd.split(' ').slice(1), { encoding: 'utf8' }))
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
