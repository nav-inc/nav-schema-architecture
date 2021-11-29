# Nav Schema Architecture (NSA)

NSA is using GraphQL to define a common data model (CDM) and event/message formats. The event or message formats are defined as GraphQL queries from the CDM.

This approach allows us to reuse graphql tools (parsers, documentation...) and focus only on building custom generators that take message format and generate language specific client libraries as well json-schema and Protobuf message definitions from the CDM.

## Why GraphQL?

Schema languages are not new, and come by the dozens: SQL, XML Schema, json-schema, Protobuf, GraphQL...

What's key to understand is that a schema language is (in general) perfectly capable of expressing a data model or a message format but not both at the same time, and that's the catch.

A message format, in relation to a data model, must be expressed as a projection of the data model. As such you need some additional semantics to express that projection.

For instance a given data entity may have 5 required fields to be considered valid. However, when a message carries that entity, it can convey an arbitrary number of attributes. Conversely, an attribute may be optional in a data schema, but in a particular context, a message schema may require that attribute. There is just no way around it, you need two distinct sets of semantics to express a data model schema and the message formats that carry entities of that data model.

In general, message schemas (e.g. json-schema) should be self-standing (without imports) as they specify type projections which vary from message to message. It may also cumbersome and brittle to include a library of files to validate a single payload.

GraphQL provides a unique set of semantics and tools that make it easy to create a Schema Architecture:

- a Schema Language
- a Query language which has "projection semantics"
- custom directives to annotate the Schema or Query language
- parsers for both syntaxes
- modern editors with syntax coloring, validation...
- Documentation generators

In essence, all that's left to do is to implement schema generators that will take message format definitions (as GraphQL Queries) and generate other schema languages such as Protobuf, json-schema, XML Schema, ... and language specific client libraries. Just to be clear, there is absolutely no graphql engine running in NSA. We only use graphql as a syntax to capture the data model and message formats. One of the big benefits that we get with that approach is that most developers (backend and frontend) are familiar with graphql.

## Architecture

```
     Metadata
  +----------------------------------------------+
  | +----------+ +----------+      +----------+  |           +-------------+             +----------+  +----------+  +----------+  +----------+
  | |          | |          |      |          |  |           |             |             | Schema 1 |  | Schema 1 |  | msg_1.go |  | msg_1.rb |
  | |  Query 1 | | Query 2  |  ... |  Query N |  |           |             |             |          |  |          |  |          |  |          |
  | |          | |          |      |          |  |           |             |             +----------+  +----------+  +----------+  +----------+
  | +-----+----+ +----+-----+      +-----+----+  |           |             |             +----------+  +----------+  +----------+  +----------+
  |       |           |                  |       |           |  Generator  |             | Schema 2 |  | Schema 2 |  | msg_2.go |  | msg_2.rb |
  |       +--------/--+------------------+       |  ----\    |             |   ----\     |          |  |          |  |          |  |          |
  |               /                              |  ----/    |             |   ----/     +----------+  +----------+  +----------+  +----------+
  | +------------/------------+                  |           |             |                 ...           ...           ...           ...
  | |                         |                  |           |             |             +----------+  +----------+  +----------+  +----------+
  | |   Integration Schema    |                  |           |             |             | Schema N |  | Schema N |  | msg_3.go |  | msg_3.rb |
  | |                         |                  |           |             |             |          |  |          |  |          |  |          |
  | +-------------------------+                  |           +-------------+             +----------+  +----------+  +----------+  +----------+
  |             |                                |                                       json-schema     protobuf        *.go         *.ruby
  +-------------|--------------------------------+
                |
                |
                |
                |                     +--------------------+                 +--------------------+
                |                     |                    |                 |                    |
                |                     |     Voyager or     |                 |     Playground     |
                |                     |     GraphQLDoc     |                 |   (query editor)   |
                |                     |                    |                 |                    |
                |                     +--------------------+                 +--------------------+
                |                                |                                      |
                |                                |                                      |
                |                     +--------------------+                            |
                |                     |    S3 Web Server   |                            |
                +-------------------->|         or         |                            |
                                      |    Apollo-Server   |<-------------------------- +
                                      +--------------------+
```

## Instructions

The code generator is meant to be run in the gitlab built pipeline and in any case, you should never commit code to the `output/` directory. However if you want to run the code generator locally, [install nodejs and npm](https://nodejs.org/en/).

The exception is the package specifiction files: `go.mod`, `nav-schema-architecture.gemspec`, and `setup.py`. The version numbers in these files are managed by the pipelines and should not be changed, but other entries such as the project description may be changed manually.

```
npm install
npm run generate-output:generate
```

The generate script uses rubocop (Ruby), unify, autoflake (Python) and goimports (Golang)

```
gem install rubocop
pip install unify
pip install --upgrade autoflake
go get golang.org/x/tools/cmd/goimports
```

The project is modular. The list of current generators (json-schema, golang, protobuf, ruby and python) can be extended easily while [some of the generators may be turned off](https://github.com/nav-inc/nav-schema-architecture/blob/main/src/generators/index.js)

It assumes the schema is in `./schema/` and the message definitions are in `./schema/message-schema-definitions`

You can also specify a set of environment variables to point to a different set of directories

| Env variable           | Example                           | Description                                                    |
| ---------------------- | --------------------------------- | -------------------------------------------------------------- |
| SCHEMA                 | schema/integration-schema.gql     | the location of the GraphQL schema (common data model)         |
| MESSAGE_DEFINITION_DIR | schema/message-schema-definitions | the parent directory where the message definitions are located |
| OUTPUT_DIR_JSON_SCHEMA | output/json-schema                | json-schema output directory                                   |
| OUTPUT_DIR_GO_STRUCT   | output/go                         | Go struct output directory                                     |
| OUTPUT_DIR_RUBY        | output/ruby                       | Ruby output directory                                          |
| GIT_ROOT               | git.nav.com/engineering           | The root of your git repo                                      |

## The Common Data Model

The schema architecture is using the GraphQL schema notation to model the Common Data Model (CDM) data types.

### Scalars

Scalars represent `leaves data types`. Currently the generator supports simple type translations and regex validations but this could be extended in the future to more sophisticated schemes. Scalars can also be used to map to native data types, while retaining the option to add more validation later. Scalar definitions are specified in the `schema/scalars` directory (one file per code generator instance)

Currently a scalar definion contains a type and optionally a regex pattern or an import statement:

```javascript
const ZIPCode = {
  type: 'string',
  pattern: '^[0-9]{5}(?:-[0-9]{4})?$',
}

const DateTime = {
  type: 'google.protobuf.Timestamp',
  import: 'google/protobuf/timestamp.proto',
}

module.exports = {
  DateTime,
  CurrencyCent,
  UUID,
  Phone,
  ZIPCode, // <-- all scalar type definition needs to be exported
  Any, // <-- reserved scalar type
}
```

The `Any` type is a reserved scalar type that is implemented without validation and should accept any (JSON) type. In Golang the `Any` type is implemented as a `json.RawMessage`.

### GraphQL Types

The CDM types are defined as expected using GraphQL Types and type extensions. The CDM will be broken down in the future to enable teams for focus on their domain. That's for instance when type extensions will come handy as it will enable a team to add properties on a type without interfering the the work of others.

```graphql
type Person {
  address: [Address]   # Array
  firstName: String!   # required
  lastName: String!    # required
  phone: Phone         # optional
}

extends type Person {
   height: Float
}
```

Enums are supported as expected and the corresponding property values are validated accordingly

```graphql
enum ProfileSource {
  USERREPORTED
  CREDITREPORT
  CASHFLOW
  CLOVER
}
```

### Message payload definitions

Currently Message definitions associated to a single types (for instance `accountCreated` event -> `Account` type). It is preferable to use entity types when possible, but sometimes complex events contain a series of entity information. In that case, it is perfectly ok to create a composite type (for instance `AccountAndSubscription`).

The first step to specify a message format is to declare it in the Query type of the schema (since we are using the GraphQL Query DSL to specify it):

```graphql
# message definitions
type Query {
  myTweets: User
  stats: Tweet
  profile: User
  # ....
}
```

The next step is to create the message specification in the corresponding directory:

```
schema/
  |
  +-- message-schema-definitions/
        |
        +-- business-profile/
              |
              | business-revenue-changed-v1.graphql
```

The corresponding message definition is a valid graphql query on the type declared about (though no validation is currently done on the query):

```graphql
{
  profile
    @namespace(value: "api.tweet.profile")
    @title(value: "User profile payload")
    @description(value: "Sample user profile")
    @version(value: 1) {
    id @field(order: 1, required: true)
    username @field(order: 2, required: true)
    firstName @field(order: 3)
    lastName @field(order: 4)
    bio @field(order: 5)
    birthdate @field(order: 6)
    email @field(order: 7, required: true)
    accountType @field(order: 8)
    verified @field(order: 9)
  }
}
```

The directives that currently used are:

`@namespace` that map to the json-schema namespace, the golang package and the ruby module associated to generated code/schema.
`@title` and `@description` are just comments added to the generated code.
`@version` should be used to refer to the major version of the schema (SemVer). Message definitions should be designed with (compatibility)[https://www.xml.com/pub/a/2004/07/21/design.html}] in mind for the minor versions.

The following values of the `@field` directive have been implemented:

- `order` maps to the field order value in the protobuf code generator
- `required` overrides the CDM schema field required attribute. When a field is required in the schema, it can be made optional in the payload definition (`required: false`). Conversely, when a field is required in the schema is can be made optional in the payload definition (`required: true`). When no changes are desired, then the field required attribute is not needed.

Message payload definitions may also be implemented with a node module that must return a [parsed gql query](https://github.com/apollographql/graphql-tag).

### Limitations

1. If you are reusing the same type in a payload, you have to use the same attributes. For instance if Address is reused twice (business address, person address), it should use the same attributes (i.e. the same projection).

## NSA Walk through

NSA's implementation is relatively simple. The [index.js](./src/index.js) shows three simple steps:

- parse (schema and message payload definitions)
- generate code
- save output files

The code generators are modular, all using a [`core generator`](./src/lib/generate.js)

The core generator is in charge of computing the projections between the graphql queries and the graphql schema while orchestrating the code generation (enums, structs, root,...).

The graphql parser produces a convoluted AST for both the schema and the message payload definition. The [parse.js](./src/lib/parse.js) library is a set of helper functions that transformed the graphql AST into code gen ready AST. The last library, [util.js](./src/lib/util.js) is made up of a series of general helper functions.

The target code generators are all structured the same way with a series of call backs for the `core generator`:

- `enumDef`
- `structDef`
- `generate` (generates the root element of the message payload definition)

The code generators are all using their corresponding [scalar file](./schema/scalars/go-scalars.js).

Finally, the `./src/generators` directory contains all the target code generators (go, python, ruby, json-schema and protobuf).

The target code generators are activated via the `./src/generators/index.js` file which exports an array of configurations:

```javascript
{
  generate: rubyGenerate,
  extension: 'rb',
  toDir: env('OUTPUT_DIR_RUBY', 'output/ruby/nsa'),
  staticDir: env('STATIC_DIR_RUBY', 'static/ruby/nsa'),
  type: 'ruby',
  outputFormatter: R.identity,
  postProcessStep: rubyPostProcessStep,
}
```

The output formatter is a simple function which can be used to make final touches to the generated code (for instance for go-lang):

```javascript
const stringFormatter = (p, context) => {
  switch (p) {
    case 'iD':
      return 'ID'
  }
  return p
}
```

The post processing step can be used to generate ancillary files such as the require file in Ruby.

The staticDir contains static files that need to be added to the generated directory structure.
