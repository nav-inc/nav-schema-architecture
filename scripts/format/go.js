#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')

async function main() {
  const goimportsCmd = 'goimports -w output/go'
  console.log('\n', chalk.blue('Formatting go output'), chalk.yellow(goimportsCmd))
  try {
    const { stdout, stderr } = await spawn(goimportsCmd.split(' ')[0], goimportsCmd.split(' ').slice(1), { encoding: 'utf8' })
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
