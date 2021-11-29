const R = require('ramda')
const { generate: goStructGenerate, postProcessStep: goPostProcessStep } = require('./go-struct.js')
const { generate: protobufGenerate, postProcessStep: protoPostProcessStep } = require('./protobuf.js')
const { generate: rubyGenerate, postProcessStep: rubyPostProcessStep } = require('./ruby.js')
const { generate: pythonGenerate } = require('./python.js')
const { generate: jsonSchemaGenerate } = require('./json-schema.js')
const { env } = require('../lib')
const config = [
  {
    generate: jsonSchemaGenerate,
    extension: 'json',
    toDir: env('OUTPUT_DIR_JSON_SCHEMA', 'output/json-schema'),
    type: 'json-schema',
    outputFormatter: (code) => JSON.stringify(code, null, 4),
  },
  {
    generate: rubyGenerate,
    extension: 'rb',
    toDir: env('OUTPUT_DIR_RUBY', 'output/ruby/nsa'),
    staticDir: env('STATIC_DIR_RUBY', 'static/ruby/nsa'),
    type: 'ruby',
    outputFormatter: R.identity,
    postProcessStep: rubyPostProcessStep,
  },
  {
    generate: pythonGenerate,
    extension: 'py',
    toDir: env('OUTPUT_DIR_PYTHON', 'output/python/nsa'),
    type: 'python',
    outputFormatter: R.identity,
  },
  {
    generate: goStructGenerate,
    extension: 'go',
    toDir: env('OUTPUT_DIR_GO_STRUCT', 'output/go/nsa'),
    type: 'golang',
    outputFormatter: R.identity,
    postProcessStep: goPostProcessStep,
  },
  {
    generate: protobufGenerate,
    extension: 'proto',
    toDir: env('OUTPUT_DIR_GO_STRUCT', 'output/protobuf/nsa'),
    type: 'protobuf',
    outputFormatter: R.identity,
    postProcessStep: protoPostProcessStep,
  },
]

module.exports = config
