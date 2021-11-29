const Date = {
  type: 'navtypes.ISODate',
  import: 'nav/date.proto'
}

const DateTime = {
  type: 'google.protobuf.Timestamp',
  import: 'google/protobuf/timestamp.proto',
}

const UUID = {
  type: 'string',
}

const Phone = {
  type: 'string',
}

const ZIPCode = {
  type: 'string',
}

const Email = {
  type: 'string',
}

const Any = {
  type: 'google.protobuf.Any',
  import: 'google/protobuf/any.proto'
}

const converter = {
  String: 'string',
  ID: 'string',
  Int: 'int64',
  Float: 'double',
  Boolean: 'bool',
  Any: 'google.protobuf.Any',
}

const stringFormatter = (p, context) => {
  switch (p) {
    case 'iD':
      return 'ID'
  }
  return p
}

module.exports = {
  Date,
  DateTime,
  UUID,
  Phone,
  Email,
  ZIPCode,
  Any,
  converter,
  stringFormatter,
}
