const R = require('ramda')
const {
  name: __name,
  metadata,
  schemaTypes,
  rootType,
  __getFields,
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
  env,
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

const messageDef = (
  { name, fields, directives },
  isRequiredProps,
  isArrayProps,
  isEnumProps,
  stringFormatter
) => `message ${name} {
${mapIndexed(
  (v, idx) => `\t${isString(value(v)) ? value(v) : convertType(fieldType(value(v)))} ${key(v)} = ${order(directives[key(v)])};`,
  fields
).join(EOL)}
}`

const fieldType = (prop) => R.pathOr('undefined_type_error', ['type'], prop)

const convertType = (t) => R.or(typeConverter(t), t)

const generate = (message, schema, stringFormatter = scalars.stringFormatter) => {
  return generateProtobuf({ message, schema: clone(schema), stringFormatter }, metadata(message))
}

const generateProtobuf = (
  { message, schema, stringFormatter },
  { name, title, namespace, version, node },
  root = rootType(schema, name)
) => {
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
    'type'
  )

  const generatedEnums = []
  const entity = camelToSnakeCase(R.last(namespace.split('.')))
  const rootStruct = R.last(protoTypes)
  const rootPropNames = R.map(extractName, rootStruct)
  const rootTypeFields = __getFields(R.head(R.filter((s) => __name(s) === root, st)))
  const rootStructTypes = R.map((p) => R.head(R.filter((rtf) => __name(rtf) === p.name, rootTypeFields)), rootStruct)
  const isRequired = R.map(
    (p) => p.value,
    noNullElementArray(R.map((p) => (p?.type?.isRequired === true ? p.name : undefined), rootStructTypes))
  )
  const isArray = R.map(
    (p) => p.value,
    noNullElementArray(R.map((p) => (p?.type?.isArray === true ? p.name : undefined), rootStructTypes))
  )

  const protoTypesGen = R.map(({ addOn, isEnum, type }) => {
    if (!isEnum) {
      return addOn
    }
    generatedEnums.push({ type, addOn })
  }, protoTypes)

  return {
    code: `
syntax = "proto3";

package ${namespace.split('.').join('_')}_${name};

// ${title}

${set(
  R.map((t) => (exists(R.path(['type', 'import'], t)) ? `import "${R.path(['type', 'import'], t)}";${EOL}` : ''), rootStruct)
).join('')}
${generatedEnums.length > 0 ? 'import "enums/enums.proto";' : ''}

option go_package = "${env('GIT_ROOT', 'git.nav.com/engineering')}/nsa-go-proto/${exists(entity) ? `${entity}/` : ''}${camelToSnakeCase(name)}";

${protoTypesGen.join(EOL + EOL).slice(0, -1)}

message ${capitalize(name)} {
    ${mapIndexed((prop, idx) => {
      const propType = extractTypeFromProp(prop)
      const directives = __directives(prop)
      const isArrayType = isArray.includes(rootPropNames[idx])
      const isEnum = R.reduce((isAnEnum, e) => isAnEnum || R.equals(e.type, propType), false, generatedEnums)
      return `${tab(idx)}${isArrayType ? 'repeated ' : ''}${isEnum ? 'nsa.' : ''}${propType} ${camelToSnakeCase(
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
  
  package enums;

  option go_package = "${env('GIT_ROOT', 'git.nav.com/engineering')}/nsa-go-proto/enums";

  ${R.map(R.path(['addOn']), enumsSet).join(EOL + EOL)}

  `
  if (exists(enumsSet) && !R.isEmpty(enumsSet)) {
    files.push(fileDescriptor(extractDir(enumsFile), 'enums/enums.proto', code))
  }
}

const schemaType = 'protobuf'

module.exports = { generate, schemaType, postProcessStep }
