const R = require('ramda')
const {
  env,
  name,
  hasName,
  enumValues,
  kind,
  metadata,
  schemaTypes,
  fieldTypeFromTypeDef,
  processFieldModifiers,
  extractType,
  extractName,
  __extractName,
  extractValue,
  findElement,
  typeIsValid,
  exists,
  rootType,
  fields,
  selections,
  clone,
  typeConverterFrom,
  propObject,
} = require('../lib')

const scalars = require('../../schema/scalars/json-schema.js')

const jsonSchemaVersion = env('JSON_SCHEMA_VERSION', 'http://json-schema.org/draft-07/schema#')

const { converter, stringFormatter = R.identity } = scalars
converter.ObjectTypeDefinition = 'object'
converter.ListType = 'array'

const reference = (t) => ({ $ref: `#${t}` })
const enumDef = (values) => ({
  enum: R.map(extractValue, values),
})

const convertType = typeConverterFrom(scalars)
/**
 * Generates the projected type, recursively
 * @param {string} prop - the property definition to be processed
 * @param {string} schemaTypes - the array of schema types, for easy lookup
 * @param {string} refTypes - The accumulator of message referenced types that need to be added to the schema at the end
 * @param {string} messageFields - The message selections associated to the prop
 */
const typeFor = (prop, schemaTypes, refTypes, messageFields) => {
  const propType = extractType(prop)
  const propName = extractName(prop)
  if (typeIsValid(propType) && exists(propName)) {
    const typeDef = findElement(propType, schemaTypes)
    switch (kind(typeDef)) {
      case 'ScalarTypeDefinition':
        const stype = scalars[name(typeDef)]
        if (R.isNil(stype)) {
          throw `Scalar type not defined ${stype}`
        }
        return stype
      case 'EnumTypeDefinition':
        return enumDef(enumValues(typeDef))
      case 'ObjectTypeDefinition':
        const objectField = hasName(propName)(messageFields)
        const childMessageFields = selections(objectField)
        // in theory this type should be named specifically for this element since
        // we could have another element using the same base type but a different set of
        // properties --> to be investigated: do we want to support that case? / hard to enforce.
        const isRequiredProps = []

        const objectType = propObject(propType, {
          $id: `#${propType}`,
          type: 'object',
          properties: R.mergeAll(
            R.map((p) => {
              const pName = name(p)
              const pType = fieldTypeFromTypeDef(pName, typeDef)
              const pTypeName = name(pType)
              if (pType?.isRequired) {
                isRequiredProps.push(pName)
              }
              const pTypeDef = typeFor(
                {
                  name: pName,
                  type: convertType(pTypeName),
                },
                schemaTypes,
                refTypes,
                childMessageFields
              )

              return pType?.isArray
                ? propObject(pName, {
                    type: 'array',
                    items: pTypeDef,
                  })
                : propObject(pName, pTypeDef)
            }, childMessageFields)
          ),
        })
        if (isRequiredProps.length > 0) {
          objectType[propType].required = isRequiredProps
        }
        refTypes.push(objectType)
        return reference(propType)
      case 'UnionTypeDefinition':
        const unionField = hasName(propName)(messageFields)
        const childTypes = selections(unionField)
        const unionType = propObject(propType, {
          $id: `#${propType}`,
          type: ['number', 'string', 'boolean', 'object', 'array', 'null'],
        })
        refTypes.push(unionType)
        return reference(propType)
    }
  }
  return { type: convertType(propType) }
}

/**
 * Calculates the intersection between the message definition and the schema types
 * The projection types are unique to that message schema and must not be reused
 * Payload schemas must be self-standing, because a type can have any number of
 * projections and projections can vary arbitrarily
 * @param message - The parsed graphql message definition
 * @param schemaTypes - The parsed graphql schema types
 * @param root - The name of the root element of the message schema/class
 */
const projectionTypes = ({ message, schemaTypes, root }) => {
  const referencedTypes = []
  const rootSchemaType = R.last(R.filter((t) => R.equals(name(t), root))(schemaTypes))
  const messageProps = R.map((p) => name(p), selections(message))
  const typeFields = R.filter((f) => R.includes(__extractName(f), messageProps), fields(rootSchemaType))

  // filter props from message definition
  const typeDef = propObject(root, {
    $id: `#${root}`,
    type: 'object',
    properties: R.mergeAll(
      R.map((prop) => propObject(extractName(prop), typeFor(prop, schemaTypes, referencedTypes, selections(message))), typeFields)
    ),
  })
  referencedTypes.push(typeDef)
  return referencedTypes
}

const generate = (message, schema, stringFormatter = scalars.stringFormatter) =>
  generateJsonSchema({ message, schema: clone(schema), stringFormatter }, metadata(message))

const generateJsonSchema = (
  { message, schema, stringFormatter },
  { name, title, description, namespace, version, node },
  root = rootType(schema, name)
) => ({
  code: rootless({
    $schema: jsonSchemaVersion,
    $id: `${env('URI_SCHEME', 'http://nav.com')}/${namespace}.schema.json/v${version}`,
    title: title,
    description: description,
    required: [name],
    type: 'object',
    properties: propObject(name, reference(root)),
    definitions: R.mergeAll(
      projectionTypes({
        message,
        schemaTypes: processFieldModifiers(schemaTypes(schema)),
        root,
        stringFormatter,
      })
    ),
    required: [],
  }),
})

const rootless = (schema, isRootless = true) => {
  if (isRootless) {
    const s = R.clone(schema)
    const props = R.pathOr({}, ['properties'], s)
    const root = R.last(R.keys(props))
    const type = props[root]['$ref'].substring(1, props[root]['$ref'].length, R.pathOr('', [root, '$ref'], props))

    const rootTypeDef = R.pathOr(null, ['definitions', type], s)

    if (rootTypeDef) {
      s.properties = rootTypeDef.properties
      delete s.definitions[type]
    }

    return s
  }
  return schema
}

const schemaType = 'json-schema'

module.exports = {
  generate,
  schemaType,
  rootless,
  convertType,
}
