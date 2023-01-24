const R = require('ramda')
const {
  metadata,
  schemaTypes,
  rootType,
  extractType,
  projectionTypes,
  processFieldModifiers,
  findElement,
  getFields,
  extractName,
  extractValue,
  fieldPattern,
  clone,
  foldObject,
  set,
  modifierSelector,
  firstUpperCase,
  mapIndexed,
  valueForKey,
  key,
  camelToSnakeCase,
  log,
  exists,
  setOfFilesFrom,
  additionalCodeFrom,
  fileDescriptor,
  filesWithExtension,
  extractDir,
  isString,
  tab,
  typeConverterFrom,
  isFieldTypeAnEnum,
  isNotEmpty,
} = require('../lib')

const scalars = require('../../schema/scalars/ruby-scalars.js')

const convertType = typeConverterFrom(scalars)

const objectFormatter = { element: 'ObjectTypeDefinition' }

const enumDef = (e, values) => `
    ${R.toUpper(e)} = %i[${R.map((v) => extractValue(v), values).join(' ')}].freeze

    def self.${camelToSnakeCase(e)}_value_valid?(v)
        ${R.toUpper(e)}.include?(v)
    end

    class Invalid${firstUpperCase(e)}Error < StandardError
    end

`
const { EOL } = require('os')

const isNotNil = (field) => `${field}.set?`

const validationRules = (fieldName, fieldType, fieldClass, pattern, isRequired, isArray, isEnum) => {
  const raise = `\t\traise(Invalid${fieldClass}Error, `
  const enumCheck = isEnum
    ? `${raise}"Enum value #{${fieldName}} is invalid") if ${isNotNil(
        fieldName
      )} && !NavSchemaArchitecture::Event::Enums::${camelToSnakeCase(fieldType)}_value_valid?(${fieldName})${EOL}`
    : ''
  let requiredCheck = isRequired ? `${raise}"Required value ${fieldName} is undefined") unless defined? ${fieldName}${EOL}` : ''
  let arrayCheck = isArray ? `${raise}"${fieldName} must be an array") unless ${fieldName}.is_a?(Array)${EOL}` : ''

  if (!isArray) {
    const nativeType = extractType2(fieldType)
    arrayCheck = isEnum
      ? ''
      : nativeType === 'Hash'
      ? `${raise}"${fieldName} must be a Hash") unless ${fieldName}.is_a?(Hash)${EOL}`
      : nativeType === 'Boolean'
      ? `${raise}"${fieldName} must be a boolean") unless [true, false].include?(${fieldName})${EOL}`
      : `${raise}"${fieldName} must be a ${nativeType}") unless ${fieldName}.is_a?(${nativeType})${EOL}`
  }

  if (!isRequired && exists(arrayCheck) && arrayCheck.length > 0) {
    arrayCheck = `
      if ${isNotNil(fieldName)} then
        ${arrayCheck}
      end

    `
  }

  if (pattern) {
    arrayCheck += `${raise}"Invalid ${fieldName} type") if ${isNotNil(fieldName)} && !${fieldName}.match?(/${pattern}/)${EOL}`
  }
  return requiredCheck + enumCheck + arrayCheck
}

const structDef = ({ name, fields }, isRequiredProps, isArrayProps, isEnumProps, stringFormatter) => {
  const fieldNames = R.map((f) => stringFormatter(key(f, objectFormatter)), fields)
  const tpe = `
    def self.${name}(${fieldNames.join(', ')})
        ${
          EOL +
          mapIndexed((v, idx) => {
            const fieldName = key(v)
            const fieldType = valueForKey(v)
            const pattern = fieldPattern(fieldType)
            const isRequired = isRequiredProps.includes(fieldName)
            const isArray = isArrayProps.includes(fieldName)
            const isEnum = isFieldTypeAnEnum(fieldType, isEnumProps)

            return validationRules(
              stringFormatter(fieldName, objectFormatter),
              fieldType,
              name,
              pattern,
              isRequired,
              isArray,
              isEnum
            )
          }, fields).join('')
        }
        {
            ${mapIndexed((v, idx) => {
              const fieldName = key(v)
              return `${tab(idx)}${tab(idx)}${tab(idx)}"${fieldName}" => ${stringFormatter(fieldName, objectFormatter)}`
            }, fields).join(',' + EOL)}
        }

    end

    class Invalid${name}Error < StandardError
    end
    `
  return tpe
}

const extractType2 = (t) => (isString(t) ? 'Hash' : extractType(t))

const generate = (message, schema, stringFormatter = scalars.stringFormatter) =>
  generateRuby({ message, schema: clone(schema), stringFormatter }, metadata(message))

const generateRuby = (
  { message, description, schema, stringFormatter = R.identity },
  { name, title, namespace, version, node },
  root = rootType(schema, name)
) => {
  try {
    const st = processFieldModifiers(schemaTypes(schema))
    const rubyTypes = projectionTypes({
      message,
      schemaTypes: st,
      root,
      scalars,
      convertType,
      structDef,
      enumDef,
      stringFormatter,
    })
    const generatedEnums = []
    const generatedTypeCode = R.map(({ addOn, isEnum, type }) => {
      if (!isEnum) {
        return addOn
      }
      generatedEnums.push({ type, addOn })
    }, set(rubyTypes, 'type'))
      .join(EOL)
      .slice(0, -1)

    const rootName = firstUpperCase(name)
    const rootStruct = R.last(rubyTypes)
    const rootDirectives = foldObject('name', 'directives', rootStruct)
    const rootTypes = foldObject('name', 'type', rootStruct)
    const rootFieldNames = R.map(extractName, rootStruct)
    const rootTypeFields = getFields(findElement(root, st))
    const rootStructTypes = R.map((p) => findElement(p.name, rootTypeFields), rootStruct)
    const [isRequired, isArray, isEnum] = R.map(
      (p) => modifierSelector(p, rootStructTypes, rootDirectives),
      ['isRequired', 'isArray', 'isEnum']
    )

    const rubyCode = `
module NavSchemaArchitecture::${R.map((n) => firstUpperCase(n), namespace.split('.')).join('::')}${version > 1 ? `::V${version}`: ''}
  module ${rootName}

# ${title}
${description ? `# ${description}` : '#'}
# generator version ${version}
${generatedTypeCode}

    def self.build(${R.map((n) => stringFormatter(n, objectFormatter), rootFieldNames).join(', ')})
        ${
          EOL +
          R.filter(
            isNotEmpty,
            mapIndexed(
              (fieldName, idx) =>
                validationRules(
                  stringFormatter(fieldName, objectFormatter),
                  rootTypes[fieldName],
                  rootName,
                  rootTypes[fieldName]?.pattern,
                  isRequired.includes(fieldName),
                  isArray.includes(fieldName),
                  isEnum.includes(fieldName)
                ),
              rootFieldNames
            )
          ).join('')
        }
        return {
            ${mapIndexed(
              (fieldName, idx) =>
                `${tab(idx)}${tab(idx)}${tab(idx)}"${fieldName}" => ${stringFormatter(fieldName, objectFormatter)},`,
              rootFieldNames
            ).join(EOL)}
        }
    end

    class Invalid${rootName}Error < StandardError
    end
  end
end
`
    return { code: rubyCode, path: rootName, additionalCode: generatedEnums, imports: [] }
  } catch (e) {
    log(e.stack)
    const err = `[ERROR] Message ${message?.name?.value} specification is incorrect: ${e.message}`
    log(err)
    return err
  }
}

const processFileName = (fname, dir, path) => {
  let pfn = R.replace(dir, '', fname)
  pfn = R.head(pfn) === '/' ? pfn.substring(1, pfn.length) : pfn
  let elements = pfn.split('/')
  const fileName = R.head(elements[elements.length - 1].split('.'))
  elements.fill(path, -1)
  elements.push(fileName)
  elements = R.map((e) => e.split('-').join('_'), elements)
  return elements.join('/')
}

const postProcessStep = (files, messageDefinitionDir) => {
  const rubyFiles = filesWithExtension('rb', files)
  const enumsFile = additionalCodeFrom('rb', files)
  const enumsSet = setOfFilesFrom('type', enumsFile)

  if (exists(rubyFiles) && !R.isEmpty(rubyFiles)) {
    const code = `
# FIXME: This resolves classes belonging to non-existent modules.
#        This is a bad thing we're doing.
module NavSchemaArchitecture
  module Event; end
end

# A shorthand alias for convenience
NSA = NavSchemaArchitecture

module NavSchemaArchitecture::Event::Enums
${exists(enumsSet) && !R.isEmpty(enumsSet) ? R.map((e) => e.addOn, enumsSet).join(EOL) : ''}
end

require "active_support/core_ext/object/blank"
require "date"

require_relative "utils"
require_relative "enums"
${R.map(
  (f) => `require_relative "${processFileName(f.outputFileName, messageDefinitionDir, camelToSnakeCase(f.path))}"`,
  rubyFiles
).join(EOL)}

`
    files.push(fileDescriptor(extractDir(rubyFiles), 'nav-schema-architecture.rb', code))
  }
}

const schemaType = 'ruby'
const version = '1.1.0'

module.exports = {
  generate,
  schemaType,
  version,
  postProcessStep,
  processFileName,
}
