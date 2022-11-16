#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')
const { version } = require('../../package.json')

async function main() {
  const pythonBumpCmd = `bumpversion --current-version ${version} patch ./output/python/setup.py --allow-dirty`
  console.log('\n', chalk.blue('Bumping python package version'), chalk.yellow(pythonBumpCmd))
  try {
    const { stdout, stderr } = await spawn(pythonBumpCmd.split(' ')[0], pythonBumpCmd.split(' ').slice(1), { encoding: 'utf8' })
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
