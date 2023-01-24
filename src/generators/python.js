const R = require('ramda')
const {
  metadata,
  schemaTypes,
  processFieldModifiers,
  projectionTypes,
  clone,
  rootType,
  extractType,
  foldObject,
  extractName,
  extractValue,
  set,
  modifierSelector,
  firstUpperCase,
  startsWithCapitalLetter,
  mapIndexed,
  valueForKey,
  _name,
  key,
  findElement,
  log,
  getFields,
  isString,
  typeConverterFrom,
  isFieldTypeAnEnum,
  propObject,
  match,
  isNotEmpty,
} = require('../lib')

const scalars = require('../../schema/scalars/python-scalars.js')

const typeConverter = typeConverterFrom(scalars)

const typeValidationConverter = (t, isArray = false) =>
  match(t)
    .on(() => isArray, `list(from_${t}`)
    .otherwise()

const enumDef = (e, values) => `
${e} = Literal[${mapIndexed((v) => `'${extractValue(v)}'`, values).join(', ')}]

def from_${e}(x: ${e}):
\treturn x
`
const { EOL } = require('os')

const formatter = (propName, format) => (format ? R.replace('%s', propName, format) : propName)
const validationRules = (fieldName, fieldType, fieldClass, pattern, isRequired, isArray, isEnum, format, isRequiredOnly) => {
  const enumCheck = isEnum ? `\t\tfrom_${extractType3(fieldType)}(${formatter(fieldName, format)})` + EOL : ''

  let requiredCheck = isRequired ? `\t\tis_required(${formatter(fieldName, format)})` + EOL : ''
  let arrayCheck = isArray ? `\t\tfrom_list(from_${extractType3(fieldType)}, ${formatter(fieldName, format)})` + EOL : ''

  let scalar = pattern ? `\t\tfrom_${fieldType.scalar}(${formatter(fieldName, format)})` + EOL : ''

  return isRequiredOnly ? requiredCheck : requiredCheck + arrayCheck + enumCheck + scalar
}

const scalarValidation = (s) => {
  const scalar = R.path([s], scalars)
  const scalarType = extractType(scalar)
  const pattern = R.path(['pattern'], scalar)
  const inputType = R.path(['inputType'], scalar)
  const instantiate = R.path(['instantiate'], scalar)
  return `${pattern ? `${s}_pattern = re.compile("${pattern}")` : ''}
def from_${s}(x: ${inputType ? `Union[${inputType}, ${scalarType}]` : 'Any'}) -> ${scalarType}:
\tif x is None: return None
${(() => {
  if (instantiate && inputType) {
    return `\tif isinstance(x, ${inputType}): x = ${instantiate}(x)`
  } else if (instantiate) {
    return `x = ${instantiate}(x)`
  }
  return ''
})()}
\tassert isinstance(x, ${scalarType})${pattern ? EOL + `\tassert ${s}_pattern.match(x)` : ''}
\treturn x
`
}

const generateValidationRules = (name, fields, isRequiredProps, isArrayProps, isEnumProps, template, isRequiredOnly) =>
  EOL +
  mapIndexed((v, idx) => {
    const fieldName = key(v)
    const fieldType = valueForKey(v)
    const isRequired = isRequiredProps.includes(fieldName)
    const isArray = isArrayProps.includes(fieldName)
    const isEnum = isFieldTypeAnEnum(fieldType, isEnumProps)
    const scalar = fieldType?.scalar ? scalars[fieldType.scalar] : undefined
    const pattern = scalar?.pattern
    return validationRules(fieldName, fieldType, name, pattern, isRequired, isArray, isEnum, template, isRequiredOnly)
  }, fields).join('')

const classVariables = (fields, isArray, isRequiredProps) =>
  R.map((f) => {
    const fieldName = key(f)
    const fieldType = typeConverter(extractType2(f[fieldName]))
    const list = isArray && isArray.includes(fieldName)
    const isRequired = isRequiredProps && isRequiredProps.includes(fieldName)

    let returnVariable = `${key(f)}: `

    let typeHint = list ? `List[${fieldType}]` : fieldType

    return (
      returnVariable +
      match(isRequired)
        .on(false, () => {
          typeHint = `Optional[${typeHint}]`
          return `${typeHint} = None`
        })
        .otherwise(() => typeHint)
    )
  }, fields)

const structDef = ({ name, fields }, isRequiredProps, isArrayProps, isEnumProps) => {
  const fieldNames = R.map((f) => key(f), fields)
  const classVars = classVariables(fields, isArrayProps, isRequiredProps)
  const tpe = `
class ${name}:

\tdef __init__(self, *, ${classVars.join(', ')}) -> None:
${generateValidationRules(name, fields, isRequiredProps, isArrayProps, isEnumProps)}
\t\t${R.map((n) => `self.${n} = ${n}`, fieldNames).join(EOL + '\t\t')}

\t@staticmethod
\tdef from_dict(obj: Any) -> '${name}':
\t\tif obj is None: return None
\t\tassert isinstance(obj, dict)
${generateValidationRules(name, fields, isRequiredProps, isArrayProps, isEnumProps, 'obj.get("%s")', true)}
\t\t${R.map((f) => {
    const fieldName = key(f)
    const fieldType = valueForKey(f)
    const isClass = isString(fieldType)
    const enums = R.map((e) => e.pName, isEnumProps)
    const isEnum = enums.includes(fieldType)
    return match(fieldType)
      .on('Any', `${fieldName} = obj.get("${fieldName}")`)
      .otherwise((ft) =>
        isClass && !isEnum
          ? `${fieldName} = ${ft}.from_dict(obj.get("${fieldName}"))`
          : `${fieldName} = from_${typeValidationConverter(
              extractType3(ft),
              isArrayProps.includes(fieldName)
            )}(obj.get("${fieldName}"))${isArrayProps.includes(fieldName) ? ')' : ''}`
      )
  }, fields).join(EOL + '\t\t')}
\t\treturn ${name}(${fieldNames.map((fieldName) => `${fieldName}=${fieldName}`)})

\tdef to_dict(self) -> dict:
\t\thash: dict = {}
${generateValidationRules(name, fields, isRequiredProps, isArrayProps, isEnumProps, 'self.%s', true)}
\t\t${R.map((f) => {
    const fieldName = key(f)
    const fieldType = valueForKey(f)
    const isClass = isString(fieldType)
    const enums = R.map((e) => e.pName, isEnumProps)
    const isEnum = enums.includes(fieldType)
    const isFieldRequired = isRequiredProps && isRequiredProps.includes(fieldName)
    return match(fieldType)
      .on('Any', `hash["${fieldName}"] = self.${fieldName}`)
      .otherwise((ft) => {
        const isHashable = isClass && !isEnum

        let returnFieldDef = isHashable
          ? `self.${fieldName}.to_dict()`
          : `from_${typeValidationConverter(extractType3(ft), isArrayProps.includes(fieldName))}(self.${fieldName})${
              isArrayProps.includes(fieldName) ? ')' : ''
            }`

        if (isHashable && !isFieldRequired) {
          returnFieldDef = `None if self.${fieldName} is None else ${returnFieldDef}`
        }

        return `hash["${fieldName}"] = ${returnFieldDef}`
      })
  }, fields).join(EOL + '\t\t')}
\t\treturn hash

def from_${name}(x: Any) -> ${name}:
    if x is None: return None
    assert isinstance(x, ${name})
    return x
`
  return tpe
}

const extractType2 = (t) => {
  return isString(t) ? t : t.isArray ? 'list' : extractType(t)
}

const extractType3 = (t) => {
  return isString(t) ? t : t.isArray ? 'list' : t.scalar ? t.scalar : extractType(t)
}

const generate = (message, schema, stringFormatter = scalars.stringFormatter) =>
  generatePython({ message, schema: clone(schema), stringFormatter }, metadata(message))

const generatePython = (
  { message, description, schema, stringFormatter = R.identity },
  { name, title, namespace, version, node },
  root = rootType(schema, name)
) => {
  try {
    const st = processFieldModifiers(schemaTypes(schema))
    const pythonTypes = projectionTypes({
      message,
      schemaTypes: st,
      root,
      scalars,
      convertType: typeConverter,
      structDef,
      enumDef,
      stringFormatter,
    })
    const generatedTypeCode = R.map(({ addOn }) => addOn, set(pythonTypes, 'type'))
      .join(EOL)
      .slice(0, -1)
    const generatedScalarCode = R.map(scalarValidation, R.filter(startsWithCapitalLetter, R.keys(scalars))).join(EOL)

    const rootName = firstUpperCase(name)
    const rootStruct = R.last(pythonTypes)
    const rootFieldNames = R.map(extractName, rootStruct)
    const rootTypes = foldObject('name', 'type', rootStruct)
    const rootDirectives = foldObject('name', 'directives', rootStruct)
    const rootTypeFields = getFields(findElement(root, st))
    const rootStructTypes = R.map((p) => findElement(p.name, rootTypeFields), rootStruct)
    const [isRequired, isArray, isEnum] = R.map(
      (p) => modifierSelector(p, rootStructTypes, rootDirectives),
      ['isRequired', 'isArray', 'isEnum']
    )
    const entryArray = R.map((e) => propObject(e, rootTypes[e]), R.keys(rootTypes))
    const classVars = classVariables(entryArray, isArray, isRequired)

    const code = `
import re
import datetime
from dateutil import parser as dateutil_parser
from typing import Any, Callable, List, Literal, Optional, TypeVar, Union

# ${namespace}

# ${title}
${description ? `# ${description}` : '#'}
# generator version ${version}

T = TypeVar("T")

def from_str(x: Any) -> str:
    if x is None: return None
    assert isinstance(x, str)
    return x


def from_int(x: Any) -> int:
    if x is None: return None
    assert isinstance(x, int) and not isinstance(x, bool)
    return x

def from_list(f: Callable[[Any], T], x: Any) -> List[T]:
    if x is None: return None
    assert isinstance(x, list)
    return [f(y) for y in x]


def from_bool(x: Any) -> bool:
    if x is None: return None
    assert isinstance(x, bool)
    return x

def from_Any(x: Any) -> Any:
    return x


def is_required(x: Any) -> Any:
    assert x is not None
    return x

${generatedScalarCode}

${generatedTypeCode}

class ${rootName}${version > 1 ? `_V${version}`: ''}:

\tdef __init__(self, *, ${classVars.join(', ')}) -> None:

${R.filter(
  isNotEmpty,
  mapIndexed(
    (fieldName, idx) =>
      validationRules(
        fieldName,
        rootTypes[fieldName],
        rootName,
        rootTypes[fieldName]?.pattern,
        isRequired.includes(fieldName),
        isArray.includes(fieldName),
        isEnum.includes(fieldName)
      ),
    rootFieldNames
  )
).join('')}
\t\t${R.map((n) => `self.${n} = ${n}`, rootFieldNames).join(EOL + '\t\t')}


\t@staticmethod
\tdef from_dict(obj: Any) -> '${rootName}':

\t\tassert isinstance(obj, dict)
${generateValidationRules(rootName, Object.entries(rootTypes), isRequired, isArray, isEnum, 'obj.get("%s")', true)}
\t\t${R.map((f) => {
      const [fieldName, fieldType] = f
      const isClass = isString(fieldType)
      const enums = R.map((e) => e.pName, isEnum)
      const isAnArray = isArray.includes(fieldName)
      const isAnEnum = enums.includes(fieldType)

      return isClass && !isAnEnum
        ? `${fieldName} = ${fieldType}.from_dict(obj.get("${fieldName}"))`
        : `${fieldName} = from_${typeValidationConverter(extractType3(fieldType), isAnArray)}(obj.get("${fieldName}"))${
            isAnArray ? ')' : ''
          }`
    }, Object.entries(rootTypes)).join(EOL + '\t\t')}
\t\treturn ${rootName}(${rootFieldNames.map((rootFieldName) => `${rootFieldName}=${rootFieldName}`)})

\tdef to_dict(self) -> dict:
\t\thash: dict = {}
\t\t${R.map((f) => {
      const fieldName = _name(f)
      const fieldType = _name(extractType(f))
      const isFieldRequired = isRequired.includes(fieldName)
      const isClass = isString(rootTypes[fieldName])
      const isAnEnum = R.pathOr(false, ['type', 'isEnum'], f)

      const isHashable = isClass && !isAnEnum

      let returnFieldDef = isHashable
        ? `self.${fieldName}.to_dict()`
        : `from_${typeValidationConverter(typeConverter(fieldType))}(self.${fieldName})`

      if (isHashable && !isFieldRequired) {
        returnFieldDef = `None if self.${fieldName} is None else ${returnFieldDef}`
      }

      return `hash["${fieldName}"] = ${returnFieldDef}`
    }, rootStructTypes).join(EOL + '\t\t')}
\t\treturn hash

def from_${rootName}(x: Any) -> ${rootName}:
    assert isinstance(x, ${rootName})
    return x

`
    return {
      code,
      path: rootName,
    }
  } catch (e) {
    const err = `[ERROR] Message ${message?.name?.value} specification is incorrect: ${e.message}`
    log(err)
    return err
  }
}

const schemaType = 'python'
const version = '1.1.0'

module.exports = {
  generate,
  schemaType,
  version,
}
