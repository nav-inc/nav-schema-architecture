#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')

async function main() {
  const gitCmd = 'git commit --allow-empty -m "ci(build): generated new nav schema output"'
  console.log('\n', chalk.blue('Committing schema output'), chalk.yellow(gitCmd))

  try {
    const { stdout, stderr } = await spawn(
      'git',
      ['commit', '--allow-empty', '-m', 'ci(build): generated new nav schema output'],
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
