const R = require('ramda')
const { parse } = require('graphql')
const { gql } = require('graphql-tag')

const { returnArray, fromFile, noNullElementArray, hasOneElement, exists, cdw, match } = require('./util')

// Helpers
const kind = R.path(['kind'])
const isA =
  (value, comparator = name) =>
  (e) =>
    R.equals(comparator(e), value)
const isObjectTypeDefinition = isA('ObjectTypeDefinition', kind)
const isObjectTypeExtension = isA('ObjectTypeExtension', kind)
const isNotObjectTypeExtension = R.compose(R.not, isA('ObjectTypeExtension', kind))

const isAnArray = isA('ListType', kind)
const isARequiredProp = isA('NonNullType', kind)
const isAnEnum = isA('EnumTypeDefinition', kind)
const isAUnion = isA('UnionTypeDefinition', kind)
const isAScalar = isA('ScalarTypeDefinition', kind)

const isName = (prop) => isA(prop, R.path(['name']))
const _name = R.path(['name', 'value'])
const name = (t) => _name(t) || _name(t?.type) || _name(t?.type?.type) || _name(t?.type?.type?.type)

const hasName = (prop) => R.compose(R.last, R.filter(isA(prop)))
const sameName = (a, b) => R.equals(name(a), name(b))

const findElement = (propType, schemaTypes) =>
  R.last(R.filter((t) => isA(propType)(t) && isNotObjectTypeExtension(t))(schemaTypes))

// Query
const query = (document) => R.find(R.propEq('operation', 'query'))(definitions(document))
const definitions = returnArray('definitions')
const selections = R.pathOr([], ['selectionSet', 'selections'])
const message = R.compose(R.head, selections, query)

const metadata = (message) => ({
  name: name(message),
  title: directiveValue(message, 'title'),
  description: directiveValue(message, 'description'),
  namespace: directiveValue(message, 'namespace'),
  version: directiveValue(message, 'version'),
  node: message,
})

/**
 *
 * @param document - the parsed graphql query (json document - see parsed-query-with-sender.json file)
 * @returns the selections of the graphql query
 */
const getMessage = (document) => ({
  message: message(document),
  description: document.description,
})

const queryForFile = (f) =>
  gql`
    ${fromFile(f)}
  `

//Field
const typeOf = (t) => _name(t?.type) || _name(t?.type?.type?.type)
const value = R.path(['value', 'value'])
const valueType = (a) => kind(R.path(['value'], a))
const args = returnArray('arguments')
const directives = returnArray('directives')
const values = returnArray('values')
const argument = (argName) => R.find((a) => isA(argName)(a))
const directiveValue = (message, prop, valueParameter = 'value') =>
  value(argument(valueParameter)(args(argument(prop)(directives(message)))))
const enumValues = (enumType) => R.map((v) => ({ value: name(v), directives: directives(v) }), values(enumType))
const order = R.path(['order'])

const getFields = R.pathOr([], ['fields'])
const __getFields = R.path(['fields'])

const fields = (schemaType) =>
  R.map(
    (f) => ({
      name: name(f),
      // no support for arguments?
      type: getFieldType(f),
      field: f,
    }),
    getFields(schemaType)
  )

const typeOfField = (f) => R.path(['field', 'type'], f)
const field = (p) => R.path(['field'], p)
const fieldPattern = (prop) => R.path(['pattern'], prop)

const fieldTypeFromTypeDef = (prop, typeDef = []) => typeOfField(R.find(isName(prop), fields(typeDef)))
const getFieldType = (f) => {
  switch (kind(__getType(f))) {
    case 'NamedType':
      return name(__getType(f))
  }
  return undefined
}

const directivesFrom = (childMessageFields, prop) =>
  R.reduce(
    (c, p) => {
      if (R.isNil(prop) || extractName(prop) === name(p))
        c[name(p)] = R.reduce(
          (d, a) => {
            d[name(a)] = value(a)
            return d
          },
          {},
          directives(p)[0].arguments
        )
      return c
    },
    {},
    childMessageFields
  )

const pDirectivesFrom = (pD) =>
  R.reduce(
    (d, a) => {
      d[name(a)] = value(a)
      return d
    },
    {},
    pD
  )

// Schema
const parseSchema = (filename) => parse(fromFile(filename))
const schemaMessageDefinitions = (schema) => R.map(name, getFields(R.last(R.filter(isQuery, schema.definitions))))
const parseMessageDefinition = (f) => {
  const messageFormat = f.indexOf('graphql') > 0 ? queryForFile(f) : require(cdw(f))
  const { message } = getMessage(messageFormat)
  return message
}

const isQuery = isA('Query')
const isMutation = isA('Mutation')
const isAType = (e) => R.not(isQuery(e) || isMutation(e))
const getType = R.pathOr({}, ['type'])
const __getType = R.path(['type'])
const ___getType = (arr) => (Array.isArray(arr) && arr.length == 2 ? extractType(arr[1]) : undefined)

const extractType = (prop) => __getType(prop) || name(__getType(field(prop))) || 'undefined_type_error'

const extractTypeFromProp = (prop) => R.pathOr(R.pathOr('undefined_type_error', ['type'], prop), ['type', 'type'], prop)
const extractName = R.pathOr('undefined_name_error', ['name'])
const __extractName = R.path(['name'])
const extractValue = R.path(['value'])
const typeIsValid = (t) => !R.equals('undefined_type_error', t)

const modifiers = (type) => {
  let isArray = false
  let isRequired = false
  if (isAnArray(type)) {
    type = __getType(type)
    isArray = true
    if (isARequiredProp(type)) {
      type = __getType(type)
      isRequired = true
    }
  } else {
    if (isARequiredProp(type)) {
      type = __getType(type)
      isRequired = true
      if (isAnArray(type)) {
        type = __getType(type)
        isArray = true
      }
    }
  }

  let isEnum = isAnEnum(type)

  return { isArray, isRequired, isEnum, type }
}

const processFieldModifiers = (schemaTypes) => {
  R.map((t) => {
    R.map((f) => {
      const { isArray, isRequired, isEnum, type } = modifiers(__getType(f))
      type.isArray = isArray
      type.isRequired = isRequired
      type.isEnum = hasOneElement(R.filter((t) => isAnEnum(t) && sameName(__getType(f), t), schemaTypes))
      type.directives = directives(f)
      if (exists(type.loc)) delete type.loc
      f.type = type
    }, getFields(t))
    return t
  }, schemaTypes)
  const extensions = R.filter(isObjectTypeExtension, schemaTypes)
  R.map((e) => {
    const parentType = R.last(R.filter((t) => isObjectTypeDefinition(t) && sameName(e, t), schemaTypes))
    const mergedFields = R.concat(getFields(parentType), getFields(e))
    parentType.fields = mergedFields
  }, extensions)
  return R.filter(isNotObjectTypeExtension, schemaTypes)
}

const modifierSelector = (modifier, typeSelection, directives) =>
  match(modifier)
    .on(
      'isRequired',
      R.map(
        (p) => p.value,
        noNullElementArray(
          R.map((p) => {
            const directive = directives[name(p)][name(p)].required
            return (exists(directive) ? directive : getType(p).isRequired) ? p.name : undefined
          }, typeSelection)
        )
      )
    )
    .otherwise(
      R.map((t) => t.value, noNullElementArray(R.map((p) => (getType(p)[modifier] ? p.name : undefined), typeSelection)))
    )

const messageEntryPoints = (document) =>
  R.map(
    (f) => ({
      name: name(f),
      type: typeOf(f),
      arguments: args(f),
      directives: directives(f),
      kind: kind(f),
      node: f,
    }),
    getFields(R.find((e) => isQuery(e) && isObjectTypeDefinition(e))(definitions(document)))
  )

const schemaTypes = (document) => R.filter(isAType)(definitions(document))
const schemaTypeDefinitionForTypeName = (typeName, schemaTypeDefs) => R.find((t) => isA(typeName)(t), schemaTypeDefs)
const rootType = (schema, root) =>
  R.compose(
    getType,
    R.last,
    R.filter((n) => R.equals(n.name, root)),
    messageEntryPoints
  )(schema)

const additionalCode = R.path(['additionalCode'])

const typeConverterFrom = (scalars) => (t) => R.pathOr(t, ['converter', t], scalars)

const pNames = (enumProps) => R.map((e) => R.path(['pName'], e), enumProps)

const isFieldTypeAnEnum = (fieldType, isEnumProps) => R.includes(fieldType, pNames(isEnumProps))

module.exports = {
  parseSchema,
  schemaMessageDefinitions,
  parseMessageDefinition,
  kind,
  isARequiredProp,
  query,
  message,
  getMessage,
  metadata,
  selections,
  args,
  directives,
  directiveValue,
  name,
  _name,
  pNames,
  hasName,
  sameName,
  typeOf,
  argument,
  value,
  valueType,
  order,
  messageEntryPoints,
  schemaTypes,
  fieldTypeFromTypeDef,
  __getType,
  ___getType,
  typeConverterFrom,
  modifiers,
  processFieldModifiers,
  modifierSelector,
  schemaTypeDefinitionForTypeName,
  extractType,
  extractTypeFromProp,
  extractName,
  __extractName,
  extractValue,
  rootType,
  fields,
  getFields,
  __getFields,
  enumValues,
  getFieldType,
  typeOfField,
  typeIsValid,
  findElement,
  fieldPattern,
  definitions,
  isA,
  additionalCode,
  isFieldTypeAnEnum,
  isAScalar,
  isAnEnum,
  isAUnion,
  isObjectTypeDefinition,
  directivesFrom,
  pDirectivesFrom,
}
