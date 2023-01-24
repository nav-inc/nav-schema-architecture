#!/usr/bin/env node

const chalk = require('chalk')
const { exec } = require('promisify-child-process')

async function main() {
  ALLOWED_ERROR_MESSAGES = ['find: -delete: ./output: relative path potentially not safe', 'Directory not empty']
  const cleanCmd =
    'find ./output ! -name go.mod ! -name go.sum ! -name nav-schema-architecture.gemspec ! -name setup.py ! -name py.typed -delete'
  console.log('\n', chalk.blue('Cleaning output'), chalk.yellow(cleanCmd))

  try {
    const { stdout, stderr } = await exec(cleanCmd)
    console.log(stdout, stderr)
  } catch (e) {
    if (
      !ALLOWED_ERROR_MESSAGES.reduce((errorContainsAllowedError, msg) => {
        return errorContainsAllowedError || e.message.includes(msg)
      }, false)
    ) {
      console.error(chalk.red(e), e.stdout, e.stderr)
      throw e
    }
    return
  }
}

if (!module.parent) main()

module.exports = main
