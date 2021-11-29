const R = require('ramda')
const {
  name: __name,
  __getType: fieldType,
  __getFields,
  metadata,
  schemaTypes,
  processFieldModifiers,
  clone,
  rootType,
  capitalize,
  firstLowerCase,
  mapIndexed,
  key,
  valueForKey,
  crlf,
  projectionTypes,
  fieldPattern,
  set,
  noNullElementArray,
  extractName,
  extractValue,
  extractTypeFromProp,
  exists,
  log,
  fileDescriptor,
  fileWith,
  extractDir,
  isString,
  tab,
  additionalCodeFrom,
  additionalCode,
  isFieldTypeAnEnum,
  typeConverterFrom,
  setOfFilesFrom,
  foldObject,
  modifierSelector,
  env,
} = require('../lib')

const { EOL } = require('os')

const scalars = require('../../schema/scalars/go-scalars.js')
const convertType = typeConverterFrom(scalars)

const enumDef = (e, values) => `
type ${e} string

const (
    ${mapIndexed(
      (v, idx) => `${tab(idx)}${extractValue(v)} ${e} = "${extractValue(v)}"${crlf(idx, values.length - 1)}`,
      values
    ).join('')}
)

func (v ${e}) Validate() error {
	switch v {
	case ${mapIndexed((v, idx) => extractValue(v), values).join(', ')}:
       return nil
	default:
	   return fmt.Errorf("%s is not a valid ${e} value", v)
	}
}

`

const structDef = ({ name, fields }, isRequiredProps, isArrayProps, isEnumProps, stringFormatter) => {
  const tpe = `type ${name} struct {
    ${mapIndexed((v, idx) => {
      const ftv = fieldType(valueForKey(v)) || valueForKey(v)
      const isArray = isArrayProps.includes(key(v))
      const isEnum = exists(R.find((e) => e.pName === ftv, isEnumProps))
      const output = `${tab(idx)}${capitalize(key(v))} ${isArray ? '[]' : '*'}${isEnum ? 'enums.' : ''}${convertType(
        ftv
      )}  \`json:"${stringFormatter(firstLowerCase(key(v)), {
        element: 'json',
      })},omitempty"\`${crlf(idx, fields.length - 1)}`
      return output
    }, fields).join('')}
}

func (o ${name}) Validate() error {
    ${mapIndexed((v, idx) => {
      const ftv = fieldType(valueForKey(v)) || valueForKey(v)
      const rawFieldName = key(v)
      const isRequired = isRequiredProps.includes(rawFieldName)
      const isArray = isArrayProps.includes(rawFieldName)
      const field = capitalize(rawFieldName)
      const pattern = fieldPattern(valueForKey(v))
      let requiredError = ''
      let validationError = ''
      let patternError = ''
      if (pattern) {
        patternError = `
    matched${field}, err := regexp.MatchString(\"${pattern}\", *o.${field})
    if !matched${field} || err != nil {
        return fmt.Errorf("invalid ${field} value of ${name} (%s)", err)
    }
    `
        if (!isRequired) {
          patternError = `
    if o.${field} != nil {${patternError}}`
        }
      }
      if (isRequired) {
        requiredError = `
    if o.${field} == nil {
        return fmt.Errorf("${field} is a required property of ${name}")
    }
    `
      }
      if ((isString(fields[rawFieldName]) && !pattern) || isFieldTypeAnEnum(ftv, isEnumProps)) {
        if (isArray) {
          validationError = `
    for _, ${rawFieldName}Element := range o.${field} {
        ${field}Error := ${rawFieldName}Element.Validate()
        if ${field}Error != nil {
            return fmt.Errorf("An element of ${field} is invalid %s", ${field}Error)
        }
    }
    `
        } else {
          validationError = `
    ${field}Error := o.${field}.Validate()
    if ${field}Error != nil {
        return fmt.Errorf("${field} is invalid %s", ${field}Error)
    }
    `
        }
        if (!isRequired) {
          validationError = `
    if o.${field} != nil {${validationError}}`
        }
      }
      return patternError + requiredError + validationError
    }, fields).join('')}
    return nil
}
`
  return tpe
}

const isEntity = (propName, typeStruct) => typeof fieldType(R.last(R.filter(R.propEq('name', propName), typeStruct))) !== 'object'

const generate = (message, schema, stringFormatter = scalars.stringFormatter) =>
  generateGolang({ message, schema: clone(schema), stringFormatter }, metadata(message))

const generateGolang = (
  { message, schema, stringFormatter },
  { name, title, namespace, version, node },
  root = rootType(schema, name)
) => {
  try {
    const st = processFieldModifiers(schemaTypes(schema))
    const goTypes = projectionTypes({
      message,
      schemaTypes: st,
      root,
      scalars,
      convertType,
      structDef,
      enumDef,
      stringFormatter,
    })
    const rootStruct = R.last(goTypes)
    const rootDirectives = foldObject('name', 'directives', rootStruct)
    const rootPropNames = R.map(extractName, rootStruct)
    const rootTypeFields = __getFields(R.head(R.filter((s) => __name(s) === root, st)))
    const rootStructTypes = R.map((p) => R.head(R.filter((rtf) => __name(rtf) === p.name, rootTypeFields)), rootStruct)
    const [isRequired, isArray] = R.map((p) => modifierSelector(p, rootStructTypes, rootDirectives), ['isRequired', 'isArray'])

    const generatedEnums = []

    const goStructs = `
package ${R.replace(/\./g, '_', namespace)}_${name}

import (
  "fmt"
  "${env('GIT_ROOT', 'git.nav.com/engineering')}/nav-schema-architecture/output/go/nsa/enums"
	"encoding/json"
	"errors"
  "regexp"
)

// ${title}


${R.map(({ addOn, isEnum, type }) => {
  if (!isEnum) {
    return addOn
  }
  generatedEnums.push({ type, addOn })
}, set(goTypes, 'type'))
  .join(EOL)
  .slice(0, -1)}

type ${capitalize(name)} struct {
    ${mapIndexed((prop, idx) => {
      const propType = extractTypeFromProp(prop)
      const isArrayType = isArray.includes(rootPropNames[idx])
      const isEnum = R.reduce((isAnEnum, e) => isAnEnum || R.equals(e.type, propType), false, generatedEnums)
      return `${tab(idx)}${capitalize(extractName(prop))} ${isArrayType ? '[]' : '*'}${
        isEnum ? 'enums.' : ''
      }${propType} \`json:"${stringFormatter(firstLowerCase(extractName(prop)), { element: 'json' })},omitempty"\``
    }, rootStruct).join(EOL)}
}

func (o ${capitalize(name)}) Validate() error {
    ${mapIndexed((v, idx) => {
      const rpn = rootPropNames[idx]
      const isReq = isRequired.includes(rpn)
      const isArr = isArray.includes(rpn)
      const field = capitalize(rpn)
      let requiredError = ''
      let validationError = ''
      if (isReq) {
        requiredError = `
    if o.${field} == nil {
        return fmt.Errorf("${field} is a required property of ${capitalize(name)}")
    }
    `
      }
      if (isEntity(rpn, rootStruct)) {
        if (isArr) {
          validationError = `
    for _, ${rpn}Element := range o.${field} {
        ${field}Error := ${rpn}Element.Validate()
        if ${field}Error != nil {
            return fmt.Errorf("An element of ${field} is invalid %s", ${field}Error)
        }
    }
    `
        } else {
          validationError = `
    ${field}Error := o.${field}.Validate()
    if ${field}Error != nil {
        return fmt.Errorf("${field} is invalid %s", ${field}Error)
    }
    `
          if (!isReq) {
            validationError = `
    if o.${field} != nil {
        ${validationError}
    }
    `
          }
        }
      }
      return requiredError + validationError
    }, rootStruct).join('')}
    return nil
}

`
    return { code: goStructs, path: name, additionalCode: generatedEnums, imports: [] }
  } catch (e) {
    const err = `[ERROR] Message ${message?.name?.value} specification is incorrect: ${e}`
    log(err)
    return err
  }
}

const postProcessStep = (files, messageDefinitionDir) => {
  const enumsFile = additionalCodeFrom('go', files)
  const enumsSet = setOfFilesFrom('type', enumsFile)
  const code = `
  package enums

  import "fmt"

  ${R.map(R.path(['addOn']), enumsSet).join(EOL)}

  `
  if (exists(enumsSet) && !R.isEmpty(enumsSet)) {
    files.push(fileDescriptor(extractDir(enumsFile), 'enums/enums.go', code))
  }
}

const schemaType = 'go-struct'

module.exports = {
  generate,
  schemaType,
  postProcessStep,
}
