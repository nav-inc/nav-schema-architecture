#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')
const { version } = require('../../package.json')

async function main() {
  const rubyBumpCmd = `bumpversion --current-version ${version} patch ./output/ruby/nav-schema-architecture.gemspec --allow-dirty`
  console.log('\n', chalk.blue('Bumping ruby gem version'), chalk.yellow(rubyBumpCmd))
  try {
    const { stdout, stderr } = await spawn(rubyBumpCmd.split(' ')[0], rubyBumpCmd.split(' ').slice(1), { encoding: 'utf8' })
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
