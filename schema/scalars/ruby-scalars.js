const Date = {
  type: 'Date'
}

const DateTime = {
  type: 'DateTime'
}

const Any = {
  type: 'Hash',
}

const UUID = {
  type: 'String',
  pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
}

const Phone = {
  type: 'String',
  pattern: '^\\+?[1-9]\\d{1,14}$',
}

const ZIPCode = {
  type: 'String',
  pattern: '^[0-9]{5}(?:-[0-9]{4})?$',
}

const Email = {
  type: 'String',
}

const stringFormatter = (p, context) => {
  switch (p) {
    case 'ID':
      return 'id'
  }
  return p
}

const converter = {
  String: 'String',
  ID: 'String',
  Int: 'Numeric',
  Float: 'Numeric',
  ListType: 'Array',
  Boolean: 'Boolean', // FIXME: This actually has no type match in Ruby, oddly.
  ObjectTypeDefinition: 'Hash',
  EnumTypeDefinition: 'enum',
}

module.exports = {
  Date,
  DateTime,
  UUID,
  Phone,
  ZIPCode,
  Email,
  Any,
  converter,
  stringFormatter,
}
