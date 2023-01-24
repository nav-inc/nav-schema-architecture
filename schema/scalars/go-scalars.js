const ISODate = {
  type: "civil.Date"
}

const DateTime = {
  type: 'time.Time',
}

const CurrencyCent = {
  type: 'int64',
}

const UUID = {
  type: 'string',
  pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
}

const Phone = {
  type: 'string',
  pattern: '^\\\\+?[1-9]\\\\d{1,14}$',
}

const ZIPCode = {
  type: 'string',
  pattern: '^[0-9]{5}(?:-[0-9]{4})?$',
}

const Email = {
  type: 'string',
}

const Any = {
  type: 'json.RawMessage',
}

const converter = {
  String: 'string',
  ID: 'string',
  Int: 'int64',
  Float: 'float64',
  Boolean: 'bool',
  Any: 'json.RawMessage',
}

// This is an example of a generalized switch statement in case
// more sophisticated conditions/transformations are needed
// for instance context dependent behavior.
// See unit tests for more examples,
// the match function is duplicated here to avoid dependencies.
const matched = (x) => ({
  on: () => matched(x),
  otherwise: () => x,
})

const match = (x) => ({
  on: (pred, fn) => {
    const _pred = typeof pred !== 'function' ? (x) => x === pred : pred
    const _fn = typeof fn !== 'function' ? () => fn : fn
    return _pred(x) ? matched(_fn(x)) : match(x)
  },
  otherwise: (fn) => (fn === undefined ? x : typeof fn !== 'function' ? fn : fn(x)),
})

const stringFormatter = (p, context) => match(p).on('iD', 'ID').otherwise()

module.exports = {
  ISODate,
  DateTime,
  CurrencyCent,
  UUID,
  Phone,
  Email,
  ZIPCode,
  Any,
  converter,
  stringFormatter,
}
