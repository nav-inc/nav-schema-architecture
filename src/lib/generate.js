const R = require('ramda')
const { EOL } = require('os')
const {
  name,
  extractName,
  value,
  kind,
  extractType,
  typeIsValid,
  fieldTypeFromTypeDef,
  fields,
  modifiers,
  selections,
  enumValues,
  findElement,
  directives,
  additionalCode,
  isAScalar,
  isAnEnum,
  isAUnion,
  isObjectTypeDefinition,
  directivesFrom,
  pDirectivesFrom,
} = require('./parse.js')
const { set, propObject, log, exists, splitByLast, filesWithExtension, match } = require('./util.js')

const inProcessedTypes = 'processedTypes'
const inProcessedEnums = 'processedEnums'

const fromContext = (context, pType, ctx = inProcessedTypes) => {
  if (!exists(context[ctx])) {
    context[ctx] = {}
  }
  return context[ctx][pType]
}

const addToContext = (context, pType, value, ctx = inProcessedTypes) => {
  if (Array.isArray(ctx)) {
    ctx.forEach((c) => addToContext(context, pType, value, c))
  } else {
    if (!exists(context[ctx])) {
      context[ctx] = {}
    }
    context[ctx][pType] = value
  }
  return value
}

const additionalCodeFrom = (extension, files) =>
  R.filter(
    exists,
    R.map((f) => (exists(additionalCode(f)) && !R.isEmpty(additionalCode(f)) ? f : null), filesWithExtension(extension, files))
  )

const setOfFilesFrom = (type = 'type', files, selector = additionalCode) => set(R.flatten(R.map(selector, files)), type)

const fileDescriptor = (toDir, fileName, code, staticDir) => {
  const [qualifiedFileName, extension] = fileName.split('.')
  const [path, outputFileName] = splitByLast('/', qualifiedFileName)
  return {
    outputFileName,
    toDir,
    staticDir,
    path,
    extension,
    code,
  }
}

const extractDir = (files) => `${R.path(['toDir'], R.head(files))}`

const updateModifiers = (
  pType,
  pName,
  pTypeName,
  requiredDirective,
  isRequiredProps,
  isArrayProps,
  isEnumProps,
  isScalarProps
) => {
  if ((pType?.isRequired && R.isNil(requiredDirective)) || requiredDirective) {
    isRequiredProps.push(pName)
  }
  if (pType?.isArray) {
    isArrayProps.push(pName)
  }
  if (pType?.isEnum) {
    isEnumProps.push({ pName: pTypeName })
  }
  if (pType?.isScalar) {
    isScalarProps.push({ pName: pTypeName })
  }
}

const computeTypeModifiers = (typeFields, scalars) =>
  R.reduce(
    (acc, t) => {
      acc[t.name] = {
        isRequired: t.field.type.isRequired,
        isArray: t.field.type.isArray,
        isEnum: t.field.type.isEnum,
        isScalar: exists(scalars[name(t.field.type)]) ? scalars[name(t.field.type)] : false,
      }
      return acc
    },
    {},
    typeFields
  )

const assign = (typeModifiers, typeDef) => {
  R.forEach((d) => {
    const isRequiredDirective = R.path(['directives', d.name, 'required'], d)
    if (typeof d.type === 'string') {
      d.isRequired = exists(isRequiredDirective) ? isRequiredDirective : typeModifiers[d.name].isRequired
      d.isArray = typeModifiers[d.name].isArray
      d.isEnum = typeModifiers[d.name].isEnum
      d.isScalar = typeModifiers[d.name].isScalar
    } else {
      d.type.isRequired = exists(isRequiredDirective) ? isRequiredDirective : typeModifiers[d.name].isRequired
      d.type.isArray = typeModifiers[d.name].isArray
      d.type.isEnum = typeModifiers[d.name].isEnum
      d.type.isScalar = typeModifiers[d.name].isScalar
    }
  }, typeDef)
}

const generatedCode = (message, additionalFile, toDir, staticDir, path, extension, code, additionalCode, formatter) => {
  const pkg = [
    {
      outputFileName: message.fileName,
      toDir,
      staticDir,
      path,
      extension,
      code: formatter(code),
      additionalCode,
    },
  ]
  if (exists(additionalFile)) {
    pkg.push({
      outputFileName: message.fileName.split('/').fill(additionalFile.name, -1).join('/'),
      toDir,
      staticDir,
      path,
      extension: extension || additionalFile.extension,
      code: additionalFile.code,
      additionalCode,
    })
  }
  return pkg
}

/**
 * typeFor recursively calls the code generator functions (structDef, enumDef, convertType, scalar types)
 * @param prop - the property specification to generate from
 *
 * @param schemaTypes - The schema type definitions
 * @param refTypes - The list of types referenced in the message definition
 * @param messageFields - The message definition (to extract directives for instance)
 */
const typeFor = (
  prop,
  schemaTypes,
  refTypes,
  messageFields,
  context,
  scalars,
  convertType,
  structDef,
  enumDef,
  stringFormatter = R.identity
) => {
  const propType = extractType(prop)
  const propName = extractName(prop)
  const { isArray, isEnum, isRequired, isScalar } = modifiers(prop)

  if (R.not(typeIsValid(propType) && exists(propName))) {
    throw `invalid type ${propType} and/or ${propName}\n ${JSON.stringify(prop)}`
  }
  return match(findElement(propType, schemaTypes))
    .on(isAScalar, (t, scalarName = name(t)) => {
      const scalarType = scalars[scalarName]
      if (R.isNil(scalarType)) {
        throw `Scalar type not defined: ${scalarName}`
      }
      scalarType.scalar = stringFormatter(scalarName, {
        element: 'ScalarTypeDefinition',
      })
      refTypes.push({
        type: scalarType,
        isScalar: true,
      })
      return scalarType
    })
    .on(isAnEnum, (t) =>
      match(fromContext(context, propType, inProcessedEnums))
        .on(exists, { type: convertType(extractType(prop)) })
        .otherwise((ctx) => {
          refTypes.push({
            type: convertType(propType),
            addOn: addToContext(context, propType, enumDef(propType, enumValues(t), stringFormatter), [
              inProcessedTypes,
              inProcessedEnums,
            ]),
            isEnum: true,
          })
          return propType
        })
    )
    .on(isAUnion, () => {
      const scalarType = scalars['Any']
      if (R.isNil(scalarType)) {
        throw `Scalar type not defined: Any`
      }
      scalarType.scalar = stringFormatter('Any', {
        element: 'ScalarTypeDefinition',
      })
      refTypes.push({
        type: scalarType,
        isScalar: true,
      })
      return scalarType
    })
    .on(isObjectTypeDefinition, (t) => {
      const objectField = findElement(propName, messageFields)
      const childMessageFields = selections(objectField)
      const isRequiredProps = []
      const isArrayProps = []
      const isEnumProps = []
      const isScalarProps = []
      const fields = R.map((p) => {
        const pName = name(p)
        const pType = fieldTypeFromTypeDef(pName, t)
        const pTypeName = name(pType)
        const pDirectives = pDirectivesFrom(R.head(directives(p)).arguments)
        const requiredDirective = R.path(['required'], pDirectives)
        updateModifiers(pType, pName, pTypeName, requiredDirective, isRequiredProps, isArrayProps, isEnumProps, isScalarProps)
        return propObject(
          pName,
          typeFor(
            {
              name: pName,
              type: convertType(pTypeName),
              directives: pDirectives,
            },
            schemaTypes,
            refTypes,
            childMessageFields,
            context,
            scalars,
            convertType,
            structDef,
            enumDef,
            stringFormatter
          )
        )
      }, childMessageFields)
      const genStructDef = structDef(
        {
          name: propType,
          fields,
          directives: directivesFrom(childMessageFields),
        },
        isRequiredProps,
        isArrayProps,
        isEnumProps,
        stringFormatter
      )
      refTypes.push({
        type: propType,
        addOn: addToContext(context, propType, genStructDef),
      })
      return propType
    })
    .otherwise({
      type: convertType(extractType(prop)),
      isRequired,
      isArray,
      isEnum,
      isScalar,
    })
}

/**
 * Calculates the intersection between the message definition and the schema types
 * The projection types are unique to that message schema and must not be reused
 * Payload schemas must be self-standing, because a type can have any number of
 * projections and projections can vary arbitrarily
 * @param typeFor - the function that recursively computes the types to generate code from
 *
 * @param message - The parsed graphql message definition
 * @param schemaTypes - The parsed graphql schema types
 * @param root - The name of the root element of the message schema/class
 */
const projection =
  (typeFor) =>
  ({ message, schemaTypes, root, scalars, convertType, structDef, enumDef, stringFormatter }) => {
    const context = { inProcessedTypes: {}, inProcessedEnums: {} }
    const referencedTypes = []
    const rootSchemaType = R.last(R.filter((t) => R.equals(name(t), root) && kind(t) !== 'ObjectTypeExtension')(schemaTypes))
    const messageProps = R.map(name, selections(message))
    const typeFields = R.filter((f) => R.includes(extractName(f), messageProps), fields(rootSchemaType))
    const messageSelections = selections(message)

    const typeDef = R.map(
      (prop) => ({
        name: extractName(prop),
        type: typeFor(
          prop,
          schemaTypes,
          referencedTypes,
          messageSelections,
          context,
          scalars,
          convertType,
          structDef,
          enumDef,
          stringFormatter
        ),
        directives: directivesFrom(messageSelections, prop),
      }),
      typeFields
    )
    const typeModifiers = computeTypeModifiers(typeFields, scalars)
    assign(typeModifiers, typeDef)
    referencedTypes.push(typeDef)
    return referencedTypes
  }

const generate = (messages, schema, generators, messageDir) => {
  log(EOL)
  const files = R.flatten(
    R.map((message) => {
      log(EOL + `[INFO] processing ${name(message)}`)
      return R.map(({ generate, extension, toDir, staticDir, outputFormatter = R.identity }) => {
        try {
          const { code, path, additionalFile, additionalCode } = generate(message, schema)
          log(`  - ${extension}`)
          return generatedCode(message, additionalFile, toDir, staticDir, path, extension, code, additionalCode, outputFormatter)
        } catch (err) {
          log(`[ERROR] ${err.message}${EOL}`)
        }
      }, generators)
    }, messages)
  )
  R.forEach(({ postProcessStep = R.identity }) => postProcessStep(files, messageDir), generators)

  return files
}

const projectionTypes = projection(typeFor)

module.exports = {
  projection,
  typeFor,
  projectionTypes,
  generate,
  additionalCodeFrom,
  setOfFilesFrom,
  fileDescriptor,
  extractDir,
  addToContext,
  fromContext,
  updateModifiers,
  generatedCode,
  computeTypeModifiers,
  assign,
}
