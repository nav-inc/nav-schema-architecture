#!/usr/bin/env node

const chalk = require('chalk')
const { spawn } = require('promisify-child-process')

async function main() {
  const protolintFixCmd = 'protolint lint -fix ./output/protobuf/'
  console.log('\n', chalk.blue('Formatting protobuf output'), chalk.yellow(protolintFixCmd))
  try {
    const { stdout, stderr } = await spawn(protolintFixCmd.split(' ')[0], protolintFixCmd.split(' ').slice(1), { encoding: 'utf8' })
    console.log(stdout, stderr)
  } catch (fixErr) {
    // protolint outputs lint failures that were fixed to stderr, causing spawn to initially fail
    console.log(chalk.yellow(fixErr), fixErr.stdout, fixErr.stderr)

    // run protolint a second time to verify there are no additional unfixed linting errors
    const protolintCmd = 'protolint lint ./output/protobuf/'
    console.log('\n', chalk.blue('Verifying protolint results'), chalk.yellow(protolintCmd))

    try {
      const { stdout, stderr } = await spawn(protolintCmd.split(' ')[0], protolintCmd.split(' ').slice(1), { encoding: 'utf8' })
      console.log(stdout, stderr)
    } catch (e) {
      console.error(chalk.red(e), e.stdout, e.stderr)

      throw e
    }
  }
}

if (!module.parent) main()

module.exports = main
