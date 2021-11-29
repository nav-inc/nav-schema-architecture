const { strictEqual } = require('assert')
const R = require('ramda')

const {
  parseSchema,
  parseMessageDefinition,
  filesFromDir,
  generate,
  env,
  additionalCodeFrom,
  extractDir,
  setOfFilesFrom,
  fileDescriptor,
  splitByLast,
  addToContext,
  fromContext,
  updateModifiers,
  generatedCode,
  computeTypeModifiers,
  assign,
} = require('../src/lib')

const { processFileName } = require('../src/generators/ruby')
const { generate: goStructGenerate } = require('../src/generators/go-struct')
const { generate: rubyGenerate } = require('../src/generators/ruby')
const { generate: pythonGenerate } = require('../src/generators/python')
const { generate: jsonSchemaGenerate } = require('../src/generators/json-schema')

const generators = [
  {
    generate: jsonSchemaGenerate,
    extension: 'json',
    toDir: env('OUTPUT_DIR_JSON_SCHEMA', 'test/samples/output/json-schema'),
    type: 'json-schema',
    outputFormatter: (code) => JSON.stringify(code, null, 4),
  },
  {
    generate: rubyGenerate,
    extension: 'rb',
    toDir: env('OUTPUT_DIR_RUBY', 'test/samples/output/ruby/nsa'),
    type: 'ruby',
    outputFormatter: R.identity,
  },
  {
    generate: pythonGenerate,
    extension: 'py',
    toDir: env('OUTPUT_DIR_PYTHON', 'test/samples/output/python/nsa'),
    type: 'python',
    outputFormatter: R.identity,
  },
  {
    generate: goStructGenerate,
    extension: 'go',
    toDir: env('OUTPUT_DIR_GO_STRUCT', 'test/samples/output/go/nsa'),
    type: 'golang',
    outputFormatter: R.identity,
  },
]

describe('Generators', function () {
  this.beforeAll(() => {
    process.env['LOG_OFF'] = true
  })

  describe('#ruby', function () {
    it('should translate a file name into a require statement', () => {
      const rootDir = 'schema/foo'
      const fileName = rootDir + '/sub-directory/file-name.rb'
      const entity = 'Entity'
      strictEqual(processFileName(fileName, rootDir, entity), 'sub_directory/Entity/file_name')
    })
  })

  describe('#Code generation', function () {
    it('should generate code', () => {
      const schema = parseSchema(process.cwd() + (process.env.SCHEMA || '/test/samples/test-schema.gql'))

      const messageFileName = `${process.cwd()}/test/samples/message-definitions/new-address.graphql`
      const messageDefinitionAsGQLQuery = parseMessageDefinition(messageFileName)

      messageDefinitionAsGQLQuery.fileName = messageFileName
      const messages = [messageDefinitionAsGQLQuery]

      const code = generate(messages, schema, generators, 'schema/message-schema-definitions')

      strictEqual(code.length, 4)
      strictEqual(code[0].extension, 'json')
      strictEqual(code[0].code.indexOf('"pattern": "^[0-9]{5}(?:-[0-9]{4})?$"') > 0, true)
      strictEqual(code[1].extension, 'rb')
      strictEqual(
        code[1].code.indexOf('raise(InvalidNewAddressError, "Required value city is undefined") unless defined? city') > 0,
        true
      )
      strictEqual(code[2].extension, 'py')
      strictEqual(code[2].code.indexOf('ZIPCode_pattern = re.compile("^[0-9]{5}(?:-[0-9]{4})?$")') > 0, true)
      strictEqual(code[2].code.indexOf('street = from_list(from_list(obj.get("street")))') > 0, true)
      strictEqual(code[3].extension, 'go')
      strictEqual(code[3].code.indexOf('func (o NewAddress) Validate() error {') > 0, true)
      strictEqual(code[3].code.indexOf('State *enums.State `json:"state,omitempty"') > 0, true)
      strictEqual(R.path(['type'], R.head(code[3].additionalCode)), 'State')
    })

    it('should update type modifiers', () => {
      const pType = { isRequired: true, isArray: true, isScalar: true, isEnum: true }
      const [isRequired, isArray, isEnum, isScalar] = [[], [], [], []]
      updateModifiers(pType, 'test', 'Test', false, isRequired, isArray, isEnum, isScalar)
      strictEqual(R.head(isArray), 'test')
      strictEqual(isRequired.length, 0)
      strictEqual(R.head(isEnum).pName, 'Test')
      strictEqual(R.head(isScalar).pName, 'Test')
      updateModifiers(pType, 'test', 'Test', true, isRequired, isArray, isEnum, isScalar)
      strictEqual(R.head(isRequired), 'test')
    })
  })
  describe('#Code generation helpers', function () {
    it('should extract the output directory of the first file', () => {
      const files = [{ toDir: 'a/' }, { toDir: 'b/' }]

      strictEqual(extractDir(files), files[0].toDir)
    })

    it('should return a proper file descriptor', () => {
      const fd = fileDescriptor('outputDir/', 'this/path/filename.ext', ['some-generated-code'])

      strictEqual('this/path', fd.path)
      strictEqual('ext', fd.extension)
      strictEqual('filename', fd.outputFileName)
      strictEqual('outputDir/', fd.toDir)
    })

    it('should split by last character', () => {
      const [a, b] = splitByLast('/', 'filename.ext')

      strictEqual(a, '')
      strictEqual(b, 'filename.ext')

      const [c, d] = splitByLast('/', 'output/dir/filename.ext')

      strictEqual(c, 'output/dir')
      strictEqual(d, 'filename.ext')
    })

    it('should return the files from the current dir', () => {
      const files = filesFromDir(process.cwd() + '/test', ['js'])

      strictEqual(files.length, 2)
    })

    it('should return the additional code for the set of types of a given extension', () => {
      const files = [
        { extension: 'go', additionalCode: [{ type: 'XYZ', addOn: 'xyz' }] },
        { extension: 'go', additionalCode: [{ type: 'TUV', addOn: 'tuv' }] },
        { extension: 'go', additionalCode: [{ type: 'TUV', addOn: 'tuv' }] },
        { extension: 'rb', additionalCode: [{ type: 'XYZ', addOn: 'xyz' }] },
      ]

      const a = additionalCodeFrom('go', files)
      const s = setOfFilesFrom('type', a)
      strictEqual(s[0].addOn, 'xyz')
      strictEqual(s[1].addOn, 'tuv')
      strictEqual(s.length, 2)
    })

    it('should return the additional code of all files from a given extension', () => {
      const files = [
        { extension: 'go', additionalCode: [{ type: 'XYZ', addOn: 'xyz' }] },
        { extension: 'go', additionalCode: [{ type: 'TUV', addOn: 'tuv' }] },
        { extension: 'go', additionalCode: [{ type: 'TUV', addOn: 'tuv' }] },
        { extension: 'rb', additionalCode: [{ type: 'XYZ', addOn: 'xyz' }] },
      ]

      const s = additionalCodeFrom('go', files)
      strictEqual(s.length, 3)
      strictEqual(s[2].additionalCode[0].addOn, 'tuv')
    })

    it('should add to and retrieve from the generator context', () => {
      let context = {}
      addToContext(context, 'ABC', 'abc', 'enums')
      const value = fromContext(context, 'ABC', 'enums')
      strictEqual(value, 'abc')
    })

    it('should prepare a code package', () => {
      const message = { fileName: '/path/to/fileName.go', code: 'tux' }
      const additionalFile = { name: 'additional.go', code: 'xyz' }
      const formatter = (str) => str.toUpperCase()

      const [code, additionalCode] = generatedCode(
        message,
        additionalFile,
        'toDir',
        'staticDir',
        'path/',
        'go',
        message.code,
        'vwx',
        formatter
      )

      strictEqual(code.outputFileName, '/path/to/fileName.go')
      strictEqual(code.code, 'TUX')
      strictEqual(additionalCode.outputFileName, '/path/to/additional.go')
      strictEqual(additionalCode.code, 'xyz')
      strictEqual(additionalCode.extension, 'go')
    })

    it('should compute type modifiers from an array of type fields', () => {
      const typeFields = [
        { name: 'field1', field: { type: { name: { value: 'String' }, isRequired: true, isArray: true, isEnum: false } } },
        { name: 'field2', field: { type: { name: { value: 'State' }, isRequired: false, isArray: false, isEnum: true } } },
      ]
      scalars = {
        String: 'string',
      }
      const { field1, field2 } = computeTypeModifiers(typeFields, scalars)
      strictEqual(field1.isRequired, true)
      strictEqual(field1.isArray, true)
      strictEqual(field1.isScalar, 'string')
      strictEqual(field2.isEnum, true)

      const typeDef = [
        { name: 'field1', type: {} },
        { name: 'field2', type: {} },
      ]
      assign({ field1, field2 }, typeDef)
      strictEqual(typeDef[0].type.isRequired, true)
      strictEqual(typeDef[0].type.isScalar, 'string')
      strictEqual(typeDef[1].type.isEnum, true)
    })
  })
})
