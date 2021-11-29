const R = require('ramda')
const { EOL } = require('os')
const {
  name,
  parseSchema,
  parseMessageDefinition,
  schemaMessageDefinitions,
  writeFileSafe,
  filesFromDir,
  log,
  noNullElementArray,
  generate,
  env,
  prepareFile,
  cp,
  match,
} = require('./lib')
const generators = require('./generators')

function parse(
  messageDefinitionDir = env('MESSAGE_DEFINITION_DIR', 'schema/message-schema-definitions'),
  schema = env('SCHEMA', '/schema/integration-schema.gql')
) {
  schema = parseSchema(process.cwd() + (process.env.SCHEMA || '/schema/integration-schema.gql'))

  const messageFiles = filesFromDir(messageDefinitionDir, ['graphql', 'gql'])
  const schemaMessageDefs = schemaMessageDefinitions(schema)
  log(EOL + EOL + `[INFO] Processing message Definitions:`)

  const messages = noNullElementArray(
    R.map((messageFileName) => {
      const message = parseMessageDefinition(`${process.cwd()}/${messageFileName}`)
      return match(name(message))
        .on(
          (n) => schemaMessageDefs.includes(n),
          (n) => {
            log(` - ${n} (${messageFileName})`)
            message.fileName = messageFileName
            return message
          }
        )
        .otherwise((n) => {
          log(EOL + `[ERROR] ${n} is not defined in the schema` + EOL)
          return null
        })
    }, messageFiles)
  )

  const code = generate(messages, schema, generators, messageDefinitionDir)

  R.forEach(
    (file) =>
      writeFileSafe(...prepareFile(file.outputFileName, file.toDir, file.path, file.extension, file.code, messageDefinitionDir)),
    code
  )

  R.forEach(({ staticDir, toDir }) => {
    cp(staticDir, toDir)
  }, generators)
}

// Make runnable through npm
if (!module.parent) parse()

// Or runnable in other scripts
module.exports = parse
