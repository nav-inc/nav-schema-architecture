const ISODate = {
  type: 'datetime.date',
  inputType: 'str',
  instantiate: 'datetime.date.fromisoformat'
}

const DateTime = {
  type: 'datetime.datetime',
  inputType: 'str',
  instantiate: 'dateutil_parser.isoparse'
}

const CurrencyCent = {
  type: 'int',
}

const Any = {
  type: 'dict',
}

const UUID = {
  type: 'str',
  pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
  snippet: '',
}

const Phone = {
  type: 'str',
  pattern: '^\\\\+?[1-9]\\\\d{1,14}$',
}

const ZIPCode = {
  type: 'str',
  pattern: '^[0-9]{5}(?:-[0-9]{4})?$',
}

const Email = {
  type: 'str',
}

const converter = {
  String: 'str',
  ID: 'str',
  Int: 'int',
  Float: 'float',
  ListType: 'list',
  Boolean: 'bool',
  ObjectTypeDefinition: 'dict',
  EnumTypeDefinition: 'enumerate',
}

module.exports = {
  ISODate,
  DateTime,
  CurrencyCent,
  UUID,
  Phone,
  ZIPCode,
  Email,
  Any,
  converter,
}
