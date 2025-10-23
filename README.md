# SPARQL-Results+XML Parse

[![Build status](https://github.com/rubensworks/sparqlxml-parse.js/workflows/CI/badge.svg)](https://github.com/rubensworks/sparqlxml-parse.js/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/rubensworks/sparqlxml-parse.js/badge.svg?branch=master)](https://coveralls.io/github/rubensworks/sparqlxml-parse.js?branch=master)
[![npm version](https://badge.fury.io/js/sparqlxml-parse.svg)](https://www.npmjs.com/package/sparqlxml-parse)

A utility package that allows you to parse [SPARQL XML](https://www.w3.org/TR/rdf-sparql-XMLres/) results
in a convenient [RDF/JS](http://rdf.js.org/)-based datastructure.

For example, the following SPARQL XML result can be converted as follows:

In:
```json
<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="book"/>
  </head>
  <results>
    <result>
      <binding name="book">
	      <uri>http://example.org/book/book1</uri>
      </binding>
    </result>
    <result>
      <binding name="book">
	      <uri>http://example.org/book/book2</uri>
      </binding>
    </result>
    <result>
      <binding name="book">
	      <uri>http://example.org/book/book3</uri>
      </binding>
    </result>
    <result>
      <binding name="book">
	      <uri>http://example.org/book/book4</uri>
      </binding>
    </result>
    <result>
      <binding name="book">
	      <uri>http://example.org/book/book5</uri>
      </binding>
    </result>
    <result>
      <binding name="book">
        <triple>
          <subject>
            <uri>http://example.org/bob</uri>
          </subject>
          <predicate>
            <uri>http://example.org/name</uri>
          </predicate>
          <object>
            <literal datatype='http://example.org/Type'>Bob</literal>
          </object>
        </triple>
      </binding>
    </result>
  </results>
</sparql>
```

Out:
```javascript
[
  { '?book': namedNode('http://example.org/book/book1') },
  { '?book': namedNode('http://example.org/book/book2') },
  { '?book': namedNode('http://example.org/book/book3') },
  { '?book': namedNode('http://example.org/book/book4') },
  { '?book': namedNode('http://example.org/book/book5') }, 
  { '?book': quad(namedNode('http://example.org/bob'), namedNode('http://example.org/name'), literal('Bob', namedNode('http://example.org/Type'))) },
]
```

Where `namedNode` is an RDF/JS named node, `quad` is an RDF/JS quad/triple, and `literal` is an RDF/JS literal.

This library automatically converts all SPARQL XML result values to their respective RDFJS type.

## Usage

### Create a new parser

```javascript
import {SparqlXmlParser} from "sparqlxml-parse";

const sparqlXmlParser = new SparqlXmlParser();
```

Optionally, you can provide a settings object to the constructor with optional parameters:
```javascript
const sparqlXmlParser = new SparqlXmlParser({
  dataFactory: dataFactory, // A custom RDFJS datafactory
  prefixVariableQuestionMark: true, // If variable names in the output should be prefixed with '?', default is false.
});
```

### Convert a SPARQL XML response stream

If you have many query results, then a streaming-based approach
as provided by `sparqlXmlParser.parseXmlResultsStream` is ideal.

```javascript
const sparqlJsonResponseStream = streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="book"/>
  </head>
  <results>
    <result>
      <binding name="book">
        <uri>http://example.org/book/book1</uri>
      </binding>
    </result>
  </results>
</sparql>`);
sparqlXmlParser.parseXmlResultsStream(sparqlJsonResponseStream)
    .on('data', (bindings: IBindings) => console.log(bindings));
// This will output [ { '?book': namedNode('http://example.org/book/book1') } ]
```

Optionally, you can also retrieve the variables inside the `head` and the version
as follows by listening to the `'variables'` and `'version'` events:
```javascript
sparqlXmlParser.parseXmlResultsStream(sparqlJsonResponseStream)
    .on('variables', (variables: RDF.Variable[]) => console.log(variables))
    .on('version', (version: string) => console.log(version))
    .on('data', (bindings: IBindings) => { return; });
// This will output [ variable('book') ]
```

The error thrown for unsupported versions can be skipped
by setting `parseUnsupportedVersions` to `true` when constructing the parser.

### Convert a SPARQL XML boolean response stream

```javascript
const sparqlJsonResponseStream = streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <boolean>true</boolean>
</sparql>`);
sparqlXmlParser.parseXmlBooleanStream(sparqlJsonResponseStream)
    .then((result: boolean) => console.log(result));
// This will output true
```

## License
This software is written by [Ruben Taelman](http://rubensworks.net/).

This code is released under the [MIT license](http://opensource.org/licenses/MIT).
