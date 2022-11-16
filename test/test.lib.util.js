const { strictEqual } = require('assert')
const console = require('console')
const R = require('ramda')
const { gql } = require('graphql-tag')

const {
  kind,
  query,
  message,
  selections,
  name,
  argument,
  value,
  valueType,
  directiveValue,
  readJSONFileSync,
  messageEntryPoints,
  schemaTypes,
  metadata,
  rootType,
  fields,
  enumValues,
  modifiers,
  isARequiredProp,
  __getType,
  extractName,
  extractValue,
  schemaMessageDefinitions,
  fieldTypeFromTypeDef: typeFromTypeDef,
  definitions,
  substringFrom,
  set,
  env,
  getFieldType,
  typeOfField,
  log,
  processFieldModifiers,
  camelToSnakeCase,
  foldObject,
  __,
  handleCapitalizedWords,
  processCameToSnake,
  prepareFile,
  isA,
  hasName,
  findElement,
  noNullElementArray,
  isString,
  isNotEmpty,
  cdw,
  filesWithExtension,
  exists,
  match,
  matchReduce,
  firstUpperCase,
  capitalize,
  firstLowerCase,
} = require('../src/lib/index.js')

const { convertType } = require('../src/generators/json-schema.js')

const sampleType = readJSONFileSync('/samples/parsed-type.json')
const sampleQuery = readJSONFileSync('/samples/parsed-query.json')
const sampleSchema = readJSONFileSync('/samples/parsed-schema.json')
const q = query(sampleQuery)

const OBJECT_TYPE_DEFINITION = {
  kind: 'ObjectTypeDefinition',
  name: {
    kind: 'Name',
    value: 'Sender',
  },
  interfaces: [],
  directives: [],
  fields: [
    {
      kind: 'FieldDefinition',
      name: {
        kind: 'Name',
        value: 'senderId',
      },
      arguments: [],
      type: {
        kind: 'NonNullType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'String',
          },
        },
      },
      directives: [],
    },
  ],
}

const SCHEMA = require('../samples/parsed-schema.json')
const { stringify } = require('querystring')

describe('Parser', function () {
  describe('#helper functions', function () {
    it('should return that luke is a Jedi', () => {
      const isAJedi = isA('Jedi', (e) => e.role)
      const luke = { name: 'Luke', role: 'Jedi' }
      strictEqual(isAJedi(luke), true)
    })

    it('should return that the character which name is Luke', () => {
      const characters = [{ name: { value: 'Luke' }, role: 'Jedi' }]
      const hisNameIsLuke = hasName('Luke')
      strictEqual(hisNameIsLuke(characters).role, 'Jedi')
    })

    it('should find the JSON type', () => {
      const schemaTypes = [
        {
          kind: 'ScalarTypeDefinition',
          name: {
            kind: 'Name',
            value: 'DateTime',
          },
          directives: [],
        },
        {
          kind: 'ScalarTypeDefinition',
          name: {
            kind: 'Name',
            value: 'JSON',
          },
          directives: [],
        },
      ]
      const e = findElement('JSON', schemaTypes)
      strictEqual('ScalarTypeDefinition', kind(e))
    })

    it('should handle capital letters in snake_case', () => {
      strictEqual('A', handleCapitalizedWords('A'))
      strictEqual('AB', handleCapitalizedWords('AB'))
      strictEqual('ABC', handleCapitalizedWords('ABC'))
      strictEqual('ABCEFGHIJ', handleCapitalizedWords('ABCEFGHIJ'))
      strictEqual('ABCEF_GHIJ', handleCapitalizedWords('ABCEF_GHIJ'))
      strictEqual('_i_', handleCapitalizedWords('_i_'))
      strictEqual('_ij_', handleCapitalizedWords('_i_j_'))
      strictEqual('abc_i_', handleCapitalizedWords('abc_i_'))
      strictEqual('ab_ij', handleCapitalizedWords('ab_i_j'))
      strictEqual('ab_ijc', handleCapitalizedWords('ab_i_j_c'))
      strictEqual('ab_ijk_cdef_uv_ghijk', handleCapitalizedWords('ab_i_j_k_cdef_u_v_ghijk'))
    })
  })

  it('should make the first letter uppercase', () => {
    const a = 'abc'
    const b = 1

    strictEqual(firstUpperCase(a), 'Abc')
    console.log(typeof b)
    strictEqual(firstUpperCase(b), '')
    strictEqual(capitalize(a), 'Abc')
  })
  it('should make the first letter lowercase', () => {
    const a = 'Abc'
    const b = 1

    strictEqual(firstLowerCase(a), 'abc')
    console.log(typeof b)
    strictEqual(firstLowerCase(b), '')
  })
})

describe('query', function () {
  describe('#kind(obj)', function () {
    it('should return undefined when the value is not present', function () {
      strictEqual(kind({}), undefined)
    })

    it('should return the kind property', function () {
      strictEqual(kind({ kind: 'test' }), 'test')
    })

    it("should return detect that's a required prop", function () {
      strictEqual(
        isARequiredProp({
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: 'Sender',
            },
          },
        }),
        true
      )
    })
  })

  describe('#query(obj)', function () {
    it('should return the query object when present', function () {
      strictEqual(kind(q), 'OperationDefinition')
    })

    it('should return undefined when not present', function () {
      strictEqual(query({}), undefined)
    })
  })

  describe('#message(obj)', function () {
    it('should return the name of the root element of the message', function () {
      strictEqual(name(message(sampleQuery)), 'navEventEnvelope')
    })

    it('should return undefined when not present', function () {
      strictEqual(message({}), undefined)
    })

    it('should return the name of a NonNullType', function () {
      strictEqual(
        name({
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: 'Sender',
            },
          },
        }),
        'Sender'
      )
    })
  })

  describe('#selections(obj)', function () {
    it('should return the query object when present', function () {
      const s = selections(q)
      strictEqual(Array.isArray(s), true)
      strictEqual(kind(s[0]), 'Field')
    })

    it('should return undefined when not present', function () {
      strictEqual(Array.isArray(selections({})), true)
      strictEqual(R.isEmpty(selections({})), true)
    })
  })

  describe('#argument(obj)', function () {
    it('should return name of type of the order argument', function () {
      const a = argument('order')([
        {
          kind: 'Argument',
          name: {
            kind: 'Name',
            value: 'order',
          },
          value: {
            kind: 'IntValue',
            value: '2',
          },
        },
      ])
      strictEqual(valueType(a), 'IntValue')
      strictEqual(value(a), '2')
    })

    it('should return undefined when not found', function () {
      strictEqual(argument('order')([]), undefined)
    })
  })

  describe('#directiveValue(obj)', function () {
    it('should return name of type of the order argument', function () {
      const v = directiveValue(
        {
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'navEventEnvelope',
          },
          arguments: [],
          directives: [
            {
              kind: 'Directive',
              name: {
                kind: 'Name',
                value: 'title',
              },
              arguments: [
                {
                  kind: 'Argument',
                  name: {
                    kind: 'Name',
                    value: 'value',
                  },
                  value: {
                    kind: 'StringValue',
                    value: 'Nav Event Envelope',
                    block: false,
                  },
                },
              ],
            },
          ],
        },
        'title'
      )
      strictEqual(v, 'Nav Event Envelope')
    })

    it('should return undefined when not found', function () {
      strictEqual(argument('order')([]), undefined)
    })
  })

  describe('#fieldTypeFromTypeDef(prop, typeDef)', function () {
    it('should return name of type of the order argument', function () {
      const v = name(__getType(typeFromTypeDef('senderId', OBJECT_TYPE_DEFINITION)))
      strictEqual(v, 'String')
    })
  })
})

describe('schema', function () {
  schemaMessageDefinitions
  describe('#schemaMessageDefinitions(obj)', function () {
    it('should validate that the first type is a scalar', function () {
      strictEqual(R.last(schemaMessageDefinitions(SCHEMA)), 'navEventEnvelope')
    })

    it('should return the name of the message entry point', function () {
      const name = extractName(R.last(messageEntryPoints(sampleSchema)))
      strictEqual(name && isString(name), true)
    })
  })
  describe('#messageEntryPoints(obj)', function () {
    it('should return undefined when the value is not present', function () {
      strictEqual(R.isEmpty(messageEntryPoints({})), true)
    })

    it('should return the name of the message entry point', function () {
      const name = extractName(R.last(messageEntryPoints(sampleSchema)))
      strictEqual(isString(name), true)
    })
  })
  describe('#schemaTypes(obj)', function () {
    it('should return undefined when the value is not present', function () {
      strictEqual(R.isEmpty(schemaTypes({})), true)
    })

    it('should return the name of the message entry point', function () {
      const n = name(schemaTypes(sampleSchema)[0])
      strictEqual(n, 'DateTime')
    })
  })
  describe('#metadata(obj)', function () {
    it('should return empty object when the values are not present', function () {
      strictEqual(extractName(metadata({})), 'undefined_name_error')
    })

    it('should return the metadata of the message entry point', function () {
      const m = metadata(message(sampleQuery))
      strictEqual(m.name, 'navEventEnvelope')
    })
  })
  describe('#rootType(obj)', function () {
    it('should return undefined when the values are not present', function () {
      strictEqual(R.isEmpty(rootType({})), true)
    })

    it('should return the type of the message entry point', function () {
      const m = rootType(sampleSchema, 'navEventEnvelope')
      strictEqual(m, 'Event')
    })
  })
  describe('#fields(obj)', function () {
    it('should return an empty array when the values are not present', function () {
      strictEqual(R.isEmpty(fields({})), true)
    })

    it('should return the list of fields of the schema type', function () {
      const m = extractName(R.last(fields(sampleType)))
      strictEqual(m, 'payload')
    })

    it('should return the type of given field', function () {
      const sample = OBJECT_TYPE_DEFINITION
      const fieldType = typeFromTypeDef('senderId', sample)
      strictEqual(name(fieldType), 'String')

      const fieldType2 = typeOfField(fields(sample)[0])
      strictEqual(name(fieldType2), 'String')
    })

    it('should detect that the property is an array, required and the corresponding type', function () {
      const sample = {
        kind: 'ListType',
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: 'EventData',
            },
          },
        },
      }

      const { isArray, isRequired, type } = modifiers(sample)
      strictEqual(isArray, true)
      strictEqual(isRequired, true)
      strictEqual(type?.name.value, 'EventData')
    })
    it('should reify the modifiers of a schema type', function () {
      const sample = [
        {
          kind: 'ObjectTypeDefinition',
          name: {
            kind: 'Name',
            value: 'Payload',
          },
          interfaces: [],
          directives: [],
          fields: [
            {
              kind: 'FieldDefinition',
              name: {
                kind: 'Name',
                value: 'operation',
              },
              arguments: [],
              type: {
                kind: 'NamedType',
                name: {
                  kind: 'Name',
                  value: 'Operation',
                },
              },
              directives: [],
            },
            {
              kind: 'FieldDefinition',
              name: {
                kind: 'Name',
                value: 'data',
              },
              arguments: [],
              type: {
                kind: 'ListType',
                type: {
                  kind: 'NonNullType',
                  type: {
                    kind: 'NamedType',
                    name: {
                      kind: 'Name',
                      value: 'EventData',
                    },
                  },
                },
              },
              directives: [],
            },
          ],
        },
      ]

      const modifiedType = processFieldModifiers(sample)
      const dataField = modifiedType[0].fields[1]
      strictEqual(dataField.type.isArray, true)
      strictEqual(dataField.type.isRequired, true)
      strictEqual(dataField.type.name.value, 'EventData')
    })

    it('should return a field type', () => {
      const f = {
        kind: 'FieldDefinition',
        name: {
          kind: 'Name',
          value: 'city',
        },
        arguments: [],
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'String',
          },
        },
        directives: [],
      }
      strictEqual('String', getFieldType(f))
    })
  })

  describe('#enumValues(obj)', function () {
    it('should return an empty array when the values are not present', function () {
      strictEqual(R.isEmpty(enumValues({})), true)
    })

    it('should return the list of values of the enum type', function () {
      const m = extractValue(
        R.last(
          enumValues({
            kind: 'EnumTypeDefinition',
            name: {
              kind: 'Name',
              value: 'Environment',
            },
            directives: [],
            values: [
              {
                kind: 'EnumValueDefinition',
                name: {
                  kind: 'Name',
                  value: 'DEV',
                },
                directives: [],
              },
              {
                kind: 'EnumValueDefinition',
                name: {
                  kind: 'Name',
                  value: 'TEST',
                  loc: {
                    start: 84,
                    end: 88,
                  },
                },
                directives: [],
              },
            ],
          })
        )
      )
      strictEqual(m, 'TEST')
    })
  })

  describe('#json schema generation', function () {
    it('should generate the correct type', () => {
      strictEqual(convertType('String'), 'string')
    })
  })
})

describe('Helper functions', function () {
  it('should create a substring from a position in the string', () => {
    strictEqual(substringFrom(1, '_string'), 'string')
  })

  it('should remove duplicates from an array of values', () => {
    strictEqual(
      6,
      set([1, 2, 3, 3]).reduce((a, v) => a + v)
    )
    strictEqual(set(['a', 'b', 'a', 'c']).length, 3)
    strictEqual(3, set([{ name: 'Luke' }, { name: 'Yoda' }, { name: 'Obi-Wan' }, { name: 'Yoda' }], 'name').length)
  })

  it('should get the NODE env variable', () => {
    strictEqual(true, R.not(R.isNil(env('NODE'))))

    strictEqual('BAR', env('FOO', 'BAR'))
  })

  it('should process from camelCase to snake case', () => {
    const cc = 'camelCase'

    strictEqual('camel_Case', processCameToSnake(cc))
    strictEqual('camel_ID', processCameToSnake('camelID'))
    strictEqual('camel_ID_Tested', processCameToSnake('camelIDTested'))
    strictEqual('camel_ID_Te', processCameToSnake('camelIDTe'))
    strictEqual('camel_ID_Tes', processCameToSnake('camelIDTes'))
    strictEqual('CAMEL_CASE', processCameToSnake('CAMEL_CASE'))
  })

  it('should convert from camelCase to snake case', () => {
    const cc = 'camelCase'

    strictEqual('camel_case', camelToSnakeCase(cc))
    strictEqual('camel_id', camelToSnakeCase('camelID'))
    strictEqual('camel_id_tested', camelToSnakeCase('camelIDTested'))
    strictEqual('camel_id_te', camelToSnakeCase('camelIDTe'))
    strictEqual('camel_id_tes', camelToSnakeCase('camelIDTes'))
    strictEqual('camel_case', camelToSnakeCase('CAMEL_CASE'))
  })

  it('should fold an object', () => {
    const arr = [
      { name: 'luke', role: 'Jedi' },
      { name: 'Obi-Wan', role: 'Jedi Knight' },
      { name: 'Darth Vader', role: 'Sith Lord' },
    ]

    const folded = foldObject('name', 'role', arr)
    strictEqual('Jedi', folded.luke)
  })

  it('should test whether a variable has been assigned or not', () => {
    let a
    const b = 2

    strictEqual(exists(b), true)
    strictEqual(exists(a), false)
  })

  it('should converts hyphens to underscores', () => {
    const h = 'hyphenated-string'

    strictEqual('hyphenated_string', __(h))
  })

  it('should test whether a variable is of type string or not', () => {
    const str = 'hello world!'
    const notAStr = [1, 2, 3, 4]

    strictEqual(isString(str), true)
    strictEqual(isString(notAStr), false)
  })

  it('should return string is not empty', () => {
    strictEqual(isNotEmpty(''), false)
    strictEqual(isNotEmpty('abc'), true)
    strictEqual(isNotEmpty(null), true)
    strictEqual(isNotEmpty(), true)
  })

  it('should prepare a file name for the generate code, from the message definition file name', () => {
    const f = 'schemadir/mymessage.graphql'
    const outputDir = 'my-favorite-language-dir'
    const path = 'messageRootElement'
    const extension = 'xyz'
    const code = '...'
    const messageDefinitionDir = 'schemadir'

    strictEqual(
      process.cwd() + '/my-favorite-language-dir/message_root_element/mymessage.xyz',
      prepareFile(f, outputDir, path, extension, code, messageDefinitionDir)[0]
    )

    const f2 = 'foo/mymessage.graphql'
    strictEqual(
      process.cwd() + '/my-favorite-language-dir/foo/message_root_element/mymessage.xyz',
      prepareFile(f2, outputDir, path, extension, code, messageDefinitionDir)[0]
    )
  })

  it('should return an array without null or undefined elements', () => {
    const a = [null, 1, 2, null, 3]
    const b = noNullElementArray(a)

    strictEqual(b.length, 3)
    strictEqual(b[2], 3)
  })

  it('should return a valid path', () => {
    const fname1 = cdw('output')
    const fname2 = cdw('/output')

    strictEqual(fname1, fname2)
  })

  it('should filter files with a given extension', () => {
    const files = [
      { name: 'f1', extension: 'go' },
      { name: 'f2', extension: 'rb' },
      { name: 'f3', extension: 'go' },
    ]

    strictEqual(filesWithExtension('go', files).length, 2)
    strictEqual(filesWithExtension('rb', files).length, 1)
  })

  it('should use match as a generalize switch statement', () => {
    const output = R.map(
      (x) =>
        match(x)
          .on((x) => x === 1, R.identity)
          .on((x) => x === 3, R.identity)
          .on((x) => x % 4 === 0, R.identity)
          .otherwise((x) => x * 2),
      [1, 2, 3, 4]
    )
    strictEqual(R.sum(output), 12)

    const testID = (p) =>
      match(p)
        .on('iD', 'ID')
        .on(
          (x) => typeof x === 'string' && x.startsWith('A'),
          (x) => x.toUpperCase()
        )
        .otherwise((x) => 1 + x)

    const [a, b, c] = [testID('iD'), testID('Abc'), testID(2)]
    strictEqual(a, 'ID')
    strictEqual(b, 'ABC')
    strictEqual(c, 3)

    const testEmptyOtherwise = match('value').otherwise()
    strictEqual(testEmptyOtherwise, 'value')

    const testMultiParam = (...x) =>
      match(...x)
        .on(function (...y) {
          return y[0] === 1
        }, 'foo')
        .on(function (...y) {
          return y[1] === 4
        }, 'bar')
        .otherwise((...y) => y[2])

    strictEqual(testMultiParam(1, 2, 3), 'foo')
    strictEqual(testMultiParam(3, 4, 5), 'bar')
    strictEqual(testMultiParam(0, 0, 3), 3)

    const testMultiParam2 = (...x) =>
      match(...x)
        .on(1, 'foo')
        .on(4, 'bar')
        .otherwise((...y) => y[2])

    strictEqual(testMultiParam2(1, 2, 3), 'foo')
    strictEqual(testMultiParam2(4, 5, 6), 'bar')
    strictEqual(testMultiParam2(0, 0, 7), 7)
  })

  it('should compose functions conditionally', () => {
    const sum = (x) =>
      matchReduce(x)
        .on(1, (y) => y + 1)
        .on(2, (y) => y + 2)
        .on(4, 5)
        .on(7, (z) => z * z * z)
        .end()

    strictEqual(sum(1), 5)
  })
})
