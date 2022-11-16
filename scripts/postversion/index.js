#!/usr/bin/env node

const chalk = require('chalk')
const tagGoModule = require('../git/tag-go-module')
const pushFilesTags = require('../git/push-files-tags')

async function main() {
  try {
    await tagGoModule()
    await pushFilesTags()
  } catch (e) {
    console.error(chalk.red(e))
    process.exit(1)
  }
}

if (!module.parent) main()

module.exports = main
