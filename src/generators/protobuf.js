const R = require('ramda')
const {
  name: __name,
  metadata,
  schemaTypes,
  rootType,
  __getFields,
  __getType: getTypeOfField,
  clone,
  exists,
  set,
  extractName,
  directives: __directives,
  mapIndexed,
  extractTypeFromProp,
  extractValue,
  capitalize,
  processFieldModifiers,
  projectionTypes,
  camelToSnakeCase,
  noNullElementArray,
  additionalCodeFrom,
  setOfFilesFrom,
  fileDescriptor,
  extractDir,
  isString,
  tab,
  key,
  order,
  valueForKey,
} = require('../lib')

const { EOL } = require('os')

const scalars = require('../../schema/scalars/protobuf-scalars.js')

const { converter } = scalars
converter.ObjectTypeDefinition = 'message'
converter.EnumTypeDefinition = 'enum'

const typeConverter = (t) => converter[t]

const value = (v) => v[key(v)]

const enumDef = (e, values) => `enum ${e} {
\t${camelToSnakeCase(e).toUpperCase()}_UNSPECIFIED = 0;
${mapIndexed(
  (v, idx) => `\t${camelToSnakeCase(extractValue(v)).toUpperCase()} = ${idx + 1};`,
  R.filter((v) => extractValue(v).indexOf('UNSPECIFIED') < 1, values)
).join(EOL)}
}`

const messageDef = ({ name, fields, directives }, _isRequiredProps, isArrayProps, isEnumProps, _stringFormatter) => {
  return `message ${name} {
    ${mapIndexed(
      (v, idx) => {
        const fieldName = key(v)
        const fieldType = getTypeOfField(valueForKey(v)) || valueForKey(v)
        const isArray = isArrayProps.includes(fieldName)
        const isEnum = exists(R.find((e) => e.pName === fieldType, isEnumProps))
        return `${tab(idx)}${isArray ? 'repeated ' : ''}${isEnum ? 'enums.' : ''}${convertType(
          isString(value(v)) ? value(v) : fieldTypeConverter(value(v))
        )} ${key(v)} = ${order(directives[key(v)])};`
      },
      fields.sort((a, b) => {
        if (parseInt(order(directives[key(a)])) > parseInt(order(directives[key(b)]))) {
          return 1
        }

        if (parseInt(order(directives[key(a)])) < parseInt(order(directives[key(b)]))) {
          return -1
        }

        return 0
      })
    ).join(EOL)}
}`
}

const fieldTypeConverter = (prop) => R.pathOr('undefined_type_error', ['type'], prop)

const convertType = (t) => R.or(typeConverter(t), t)

const generate = (message, schema, stringFormatter = scalars.stringFormatter) => {
  return generateProtobuf({ message, schema: clone(schema), stringFormatter }, metadata(message))
}

const generateProtobuf = ({ message, schema, stringFormatter }, { name, title, namespace, version }, root = rootType(schema, name)) => {
  const st = processFieldModifiers(schemaTypes(schema))
  const protoTypes = set(
    projectionTypes({
      message,
      schemaTypes: st,
      root,
      scalars,
      convertType,
      structDef: messageDef,
      enumDef,
      stringFormatter,
    }),
    (i) => (typeof i.type === 'object' ? i.type?.type : i.type)
  )

  const generatedEnums = []
  const generatedScalars = []
  const entity = `${camelToSnakeCase(R.last(namespace.split('.')))}${version > 1 ? `_v${version}` : ''}`
  const rootStruct = R.last(protoTypes).sort((a, b) => {
    const aDirectives = __directives(a)
    const bDirectives = __directives(b)
    if (parseInt(order(aDirectives[extractName(a)])) > parseInt(order(bDirectives[extractName(b)]))) {
      return 1
    }

    if (parseInt(order(aDirectives[extractName(a)])) < parseInt(order(bDirectives[extractName(b)]))) {
      return -1
    }

    return 0
  })
  const rootPropNames = R.map(extractName, rootStruct)
  const rootTypeFields = __getFields(R.head(R.filter((s) => __name(s) === root, st)))
  const rootStructTypes = R.map((p) => R.head(R.filter((rtf) => __name(rtf) === p.name, rootTypeFields)), rootStruct)

  // TODO: enable for non-optional fields in proto3 when the rest of the nav ecosystem supports proto3 optional fields
  /* const isRequired = R.map(
    (p) => p.value,
    noNullElementArray(R.map((p) => (p?.type?.isRequired === true ? p.name : undefined), rootStructTypes))
  ) */

  const isArray = R.map(
    (p) => p.value,
    noNullElementArray(R.map((p) => (p?.type?.isArray === true ? p.name : undefined), rootStructTypes))
  )

  const protoTypesGen = R.map(({ addOn, isEnum, isScalar, type }) => {
    if (isScalar || R.path('scalar', type)) {
      generatedScalars.push(type)
    }
    if (!isEnum) {
      return addOn
    }
    generatedEnums.push({ type, addOn })
  }, protoTypes)

  return {
    code: `syntax = "proto3";

package nsa.${camelToSnakeCase(namespace)}${version > 1 ? `.v${version}` : ''}.${camelToSnakeCase(name)};

// ${title}

${[
  ...new Set(
    R.concat(
      R.map((t) => (exists(R.path(['type', 'import'], t)) ? `import "${R.path(['type', 'import'], t)}";${EOL}` : ''), rootStruct),
      R.map((i) => (exists(i) ? `import "${i}";${EOL}` : ''), R.map(R.path(['import']), generatedScalars))
    )
  ),
].join('')}
${generatedEnums.length > 0 ? 'import "nsa/enums/enums.proto";' : ''}

option go_package = "git.nav.com/backend/go-proto/nsa/${exists(entity) ? `${entity}/` : ''}${camelToSnakeCase(name)}";

${protoTypesGen.join(EOL + EOL).slice(0, -1)}

message ${capitalize(name)} {
    ${mapIndexed((prop, idx) => {
      const propType = extractTypeFromProp(prop)
      const directives = __directives(prop)
      const isArrayType = isArray.includes(rootPropNames[idx])
      const isEnum = R.reduce((isAnEnum, e) => isAnEnum || R.equals(e.type, propType), false, generatedEnums)
      return `${tab(idx)}${isArrayType ? 'repeated ' : ''}${isEnum ? 'enums.' : ''}${propType} ${camelToSnakeCase(
        extractName(prop)
      )} = ${order(directives[extractName(prop)])};`
    }, rootStruct).join(EOL)}
}

`,
    path: name,
    additionalCode: generatedEnums,
    imports: [],
  }
}

const postProcessStep = (files, messageDefinitionDir) => {
  const enumsFile = additionalCodeFrom('proto', files)
  const enumsSet = setOfFilesFrom('type', enumsFile)
  const code = `
  syntax = "proto3";

  package nsa.enums;

  option go_package = "git.nav.com/backend/go-proto/nsa/enums";

  ${R.map(R.path(['addOn']), enumsSet).join(EOL + EOL)}

  `
  if (exists(enumsSet) && !R.isEmpty(enumsSet)) {
    files.push(fileDescriptor(extractDir(enumsFile), 'enums/enums.proto', code))
  }
}

const schemaType = 'protobuf'

module.exports = { generate, schemaType, postProcessStep }
