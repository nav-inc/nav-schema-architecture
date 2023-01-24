#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')

async function main() {
  const yapfCmd = 'yapf -irp --verbose *.py output/python'
  const unifyCmd = 'unify -ir output/python'
  const autoflakeCmd = 'autoflake -ir --remove-all-unused-imports --ignore-init-module-imports output/python'
  console.log('\n', chalk.blue('Formatting python output'), chalk.yellow(yapfCmd))
  console.log('\n', chalk.blue('Formatting python output'), chalk.yellow(unifyCmd))
  console.log('\n', chalk.blue('Formatting python output'), chalk.yellow(autoflakeCmd))
  try {
    let stdout, stderr
    ;({ stdout, stderr } = await spawn(yapfCmd.split(' ')[0], yapfCmd.split(' ').slice(1), { encoding: 'utf8' }))
    console.log(stdout, stderr)
    ;({ stdout, stderr } = await spawn(unifyCmd.split(' ')[0], unifyCmd.split(' ').slice(1), { encoding: 'utf8' }))
    console.log(stdout, stderr)
    ;({ stdout, stderr } = await spawn(autoflakeCmd.split(' ')[0], autoflakeCmd.split(' ').slice(1), { encoding: 'utf8' }))
    console.log(stdout, stderr)
  } catch (e) {
    console.error(chalk.red(e), e.stdout, e.stderr)
    throw e
  }
}

if (!module.parent) main()

module.exports = main
