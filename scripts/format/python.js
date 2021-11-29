#!/usr/bin/env node

const chalk = require('chalk')
const { exec } = require('promisify-child-process')

async function main() {
  const yapfCmd =
    'yapf -irp --verbose *.py output/python && unify -ir output/python && autoflake -ir --remove-all-unused-imports --ignore-init-module-imports output/python'
  console.log('\n', chalk.blue('Formatting python output'), chalk.yellow(yapfCmd))
  try {
    let { stdout, stderr } = await exec(yapfCmd)
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
