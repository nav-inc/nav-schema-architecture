#!/usr/bin/env node

const chalk = require('chalk')
const { exec } = require('promisify-child-process')
const { version } = require('../../package.json')

async function main() {
  const pythonBumpCmd = `bumpversion --current-version ${version} patch ./output/python/setup.py --allow-dirty`
  console.log('\n', chalk.blue('Bumping python package version'), chalk.yellow(pythonBumpCmd))
  try {
    let { stdout, stderr } = await exec(pythonBumpCmd)
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
