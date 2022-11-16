#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')
const { version } = require('../../package.json')

async function main() {
  const gitCmd = `git tag -a "output/go/v${version}" -m "go module tag version v${version}"`
  console.log('\n', chalk.blue('Tagging for go module definition'), chalk.yellow(gitCmd))

  try {
    const { stdout, stderr } = await spawn(
      'git',
      ['tag', '-a', `output/go/v${version}`, '-m', `go module tag version v${version}`],
      { encoding: 'utf8' }
    )
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
