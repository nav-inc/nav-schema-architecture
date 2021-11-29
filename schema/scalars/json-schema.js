const Date = {
  type: "string",
  pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
}

const DateTime = {
  type: 'string',
  pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$',
}

const CurrencyCent = {
  type: 'integer',
}

const UUID = {
  type: 'string',
  pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
}

const Phone = {
  type: 'string',
  pattern: '^\\+?[1-9]\\d{1,14}$',
}

const ZIPCode = {
  type: 'string',
  pattern: '^[0-9]{5}(?:-[0-9]{4})?$',
}

const Email = {
  type: 'string',
}

const Any = {
  type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
}

const converter = {
  String: 'string',
  ID: ['number', 'string'],
  Int: 'integer',
  Float: 'number',
  Boolean: 'boolean',
}

module.exports = {
  Date,
  DateTime,
  Phone,
  Email,
  ZIPCode,
  UUID,
  Any,
  converter,
}
