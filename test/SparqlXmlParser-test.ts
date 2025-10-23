import {DataFactory} from "rdf-data-factory";
import "jest-rdf";
import {PassThrough} from "stream";
import {SparqlXmlParser} from "../lib/SparqlXmlParser";
import arrayifyStream from 'arrayify-stream';
const streamifyString = require('streamify-string');

const DF = new DataFactory();

// tslint:disable:no-trailing-whitespace

describe('SparqlXmlParser', () => {

  describe('constructed without options', () => {
    const optionlessInstance = new SparqlXmlParser();

    it('should be a valid instance', () => {
      return expect(optionlessInstance).toBeInstanceOf(SparqlXmlParser);
    });

    it('should have the default data factory', () => {
      return expect((<any> optionlessInstance).dataFactory).toBeInstanceOf(DataFactory);
    });

    it('should not prefix variables with a question mark', () => {
      return expect((<any> optionlessInstance).prefixVariableQuestionMark).toBeFalsy();
    });
  });

  describe('constructed with empty options', () => {
    const optionsEmptyInstance = new SparqlXmlParser({});

    it('should be a valid instance', () => {
      return expect(optionsEmptyInstance).toBeInstanceOf(SparqlXmlParser);
    });

    it('should have the default data factory', () => {
      return expect((<any> optionsEmptyInstance).dataFactory).toBeInstanceOf(DataFactory);
    });

    it('should not prefix variables with a question mark', () => {
      return expect((<any> optionsEmptyInstance).prefixVariableQuestionMark).toBeFalsy();
    });
  });

  describe('constructed with options', () => {
    const optionsInstance = new SparqlXmlParser({ dataFactory: <any> 'abc', prefixVariableQuestionMark: true });

    it('should be a valid instance', () => {
      return expect(optionsInstance).toBeInstanceOf(SparqlXmlParser);
    });

    it('should have the default data factory', () => {
      return expect((<any> optionsInstance).dataFactory).toEqual('abc');
    });

    it('should not prefix variables with a question mark', () => {
      return expect((<any> optionsInstance).prefixVariableQuestionMark).toBeTruthy();
    });
  });

  let parser;

  beforeEach(() => {
    parser = new SparqlXmlParser({ prefixVariableQuestionMark: true });
  });

  describe('#parseXmlResultsStream', () => {
    it('should convert an empty SPARQL XML response', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">

  <head>
  </head>

  <results>
  </results>

</sparql>
`)))).toEqual([]);
    });

    it('should convert an empty SPARQL XML response and emit the variables', async () => {
      const stream = parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
  </head>
  <results>
  </results>
</sparql>
`));
      return expect(new Promise((resolve) => stream.on('variables', resolve))).resolves.toEqualRdfTermArray([
      ]);
    });

    it('should convert a very empty SPARQL XML response and emit the variables', async () => {
      const stream = parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <results>
  </results>
</sparql>
`));
      return expect(new Promise((resolve) => stream.on('variables', resolve))).resolves.toEqualRdfTermArray([
      ]);
    });

    it('should convert an empty SPARQL XML response and emit the version', async () => {
      const stream = parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#" version="1.2">
  <head>
  </head>
  <results>
  </results>
</sparql>
`));
      return expect(new Promise((resolve) => stream.on('version', resolve))).resolves.toBe('1.2');
    });

    it('should throw on an unknown SPARQL version', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#" version="1.2-unknown">
  <head>
  </head>
  <results>
  </results>
</sparql>`)))).rejects.toThrow(`Detected unsupported version: 1.2-unknown`);
    });


    it('should convert a SPARQL XML response', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
    <variable name="hpage"/>
    <variable name="name"/>
    <variable name="nickname"/>
    <variable name="age"/>
    <variable name="mbox"/>
    <variable name="friend"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <bnode>r1</bnode>
      </binding>
      <binding name="hpage">
	      <uri>http://work.example.org/bob1/</uri>
      </binding>
      <binding name="name">
	      <literal xml:lang="en">Bob1</literal>
      </binding>
      <binding name="nickname">
	      <literal>Bobby1</literal>
      </binding>
      <binding name="age">
	      <literal datatype="http://www.w3.org/2001/XMLSchema#integer">1</literal>
      </binding>
      <binding name="mbox">
	      <uri>mailto:bob1@work.example.org</uri>
      </binding>
    </result>

    <result>
      <binding name="x">
	      <bnode>r2</bnode>
      </binding>
      <binding name="hpage">
	      <uri>http://work.example.org/bob2/</uri>
      </binding>
      <binding name="name">
	      <literal xml:lang="en">Bob2</literal>
      </binding>
      <binding name="nickname">
	      <literal>Bobby2</literal>
      </binding>
      <binding name="age">
	      <literal datatype="http://www.w3.org/2001/XMLSchema#integer">2</literal>
      </binding>
      <binding name="mbox">
	      <uri>mailto:bob2@work.example.org</uri>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          {
            '?age': DF.literal('1', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            '?hpage': DF.namedNode('http://work.example.org/bob1/'),
            '?mbox': DF.namedNode('mailto:bob1@work.example.org'),
            '?name': DF.literal('Bob1', 'en'),
            '?nickname': DF.literal('Bobby1'),
            '?x': DF.blankNode('r1'),
          },
          {
            '?age': DF.literal('2', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            '?hpage': DF.namedNode('http://work.example.org/bob2/'),
            '?mbox': DF.namedNode('mailto:bob2@work.example.org'),
            '?name': DF.literal('Bob2', 'en'),
            '?nickname': DF.literal('Bobby2'),
            '?x': DF.blankNode('r2'),
          },
        ]);
    });

    it('should convert a SPARQL XML response with directions', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#"
  xmlns:its="http://www.w3.org/2005/11/its" 
  its:version="2.0">
  <head>
    <variable name="x"/>
    <variable name="hpage"/>
    <variable name="name"/>
    <variable name="nickname"/>
    <variable name="age"/>
    <variable name="mbox"/>
    <variable name="friend"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <bnode>r1</bnode>
      </binding>
      <binding name="hpage">
	      <uri>http://work.example.org/bob1/</uri>
      </binding>
      <binding name="name">
	      <literal xml:lang="en" its:dir="ltr">Bob1</literal>
      </binding>
      <binding name="nickname">
	      <literal>Bobby1</literal>
      </binding>
      <binding name="age">
	      <literal datatype="http://www.w3.org/2001/XMLSchema#integer">1</literal>
      </binding>
      <binding name="mbox">
	      <uri>mailto:bob1@work.example.org</uri>
      </binding>
    </result>

    <result>
      <binding name="x">
	      <bnode>r2</bnode>
      </binding>
      <binding name="hpage">
	      <uri>http://work.example.org/bob2/</uri>
      </binding>
      <binding name="name">
	      <literal xml:lang="en" its:dir="rtl">Bob2</literal>
      </binding>
      <binding name="nickname">
	      <literal>Bobby2</literal>
      </binding>
      <binding name="age">
	      <literal datatype="http://www.w3.org/2001/XMLSchema#integer">2</literal>
      </binding>
      <binding name="mbox">
	      <uri>mailto:bob2@work.example.org</uri>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          {
            '?age': DF.literal('1', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            '?hpage': DF.namedNode('http://work.example.org/bob1/'),
            '?mbox': DF.namedNode('mailto:bob1@work.example.org'),
            '?name': DF.literal('Bob1', { language: 'en', direction: 'ltr' }),
            '?nickname': DF.literal('Bobby1'),
            '?x': DF.blankNode('r1'),
          },
          {
            '?age': DF.literal('2', DF.namedNode('http://www.w3.org/2001/XMLSchema#integer')),
            '?hpage': DF.namedNode('http://work.example.org/bob2/'),
            '?mbox': DF.namedNode('mailto:bob2@work.example.org'),
            '?name': DF.literal('Bob2', { language: 'en', direction: 'rtl' }),
            '?nickname': DF.literal('Bobby2'),
            '?x': DF.blankNode('r2'),
          },
        ]);
    });

    it('should convert a SPARQL XML response with a single binding', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <bnode>r1</bnode>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          { '?x': DF.blankNode('r1') },
        ]);
    });

    it('should convert a SPARQL XML response with a single quoted triple binding', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
              <uri>http://example.org/alice</uri>
          </subject>
          <predicate>
              <uri>http://example.org/name</uri>
          </predicate>
          <object>
              <literal datatype='http://example.org/Type'>Alice</literal>
          </object>
        </triple>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          { '?x': DF.quad(DF.namedNode('http://example.org/alice'), DF.namedNode('http://example.org/name'), DF.literal('Alice', DF.namedNode('http://example.org/Type'))) },
        ]);
    });

    it('should convert a SPARQL XML response with a single nested quoted triple binding in subject', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
            <triple>
              <subject>
                  <uri>http://example.org/alice</uri>
              </subject>
              <predicate>
                  <uri>http://example.org/name</uri>
              </predicate>
              <object>
                  <literal datatype='http://example.org/Type'>Alice</literal>
              </object>
            </triple>
          </subject>
          <predicate>
              <uri>http://example.org/sayedBy</uri>
          </predicate>
          <object>
              <uri>http://example.org/alice</uri>
          </object>
        </triple>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          { '?x': DF.quad(
              DF.quad(DF.namedNode('http://example.org/alice'), DF.namedNode('http://example.org/name'), DF.literal('Alice', DF.namedNode('http://example.org/Type'))),
              DF.namedNode('http://example.org/sayedBy'),
              DF.namedNode('http://example.org/alice'),
            ) },
        ]);
    });

    it('should convert a SPARQL XML response with multiple nested quoted triple bindings in subject', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
            <triple>
              <subject>
                  <uri>http://example.org/alice</uri>
              </subject>
              <predicate>
                  <uri>http://example.org/name</uri>
              </predicate>
              <object>
                  <literal datatype='http://example.org/Type'>Alice</literal>
              </object>
            </triple>
          </subject>
          <predicate>
              <uri>http://example.org/sayedBy</uri>
          </predicate>
          <object>
              <uri>http://example.org/alice</uri>
          </object>
        </triple>
      </binding>
      <binding name="y">
	      <triple>
          <subject>
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
          </subject>
          <predicate>
              <uri>http://example.org/sayedBy</uri>
          </predicate>
          <object>
              <uri>http://example.org/bob</uri>
          </object>
        </triple>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          {
            '?x': DF.quad(
              DF.quad(DF.namedNode('http://example.org/alice'), DF.namedNode('http://example.org/name'), DF.literal('Alice', DF.namedNode('http://example.org/Type'))),
              DF.namedNode('http://example.org/sayedBy'),
              DF.namedNode('http://example.org/alice'),
            ),
            '?y': DF.quad(
              DF.quad(DF.namedNode('http://example.org/bob'), DF.namedNode('http://example.org/name'), DF.literal('Bob', DF.namedNode('http://example.org/Type'))),
              DF.namedNode('http://example.org/sayedBy'),
              DF.namedNode('http://example.org/bob'),
            ),
          },
        ]);
    });

    it('should convert a SPARQL XML response with multiple results with nested triples', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
            <triple>
              <subject>
                  <uri>http://example.org/alice</uri>
              </subject>
              <predicate>
                  <uri>http://example.org/name</uri>
              </predicate>
              <object>
                  <literal datatype='http://example.org/Type'>Alice</literal>
              </object>
            </triple>
          </subject>
          <predicate>
              <uri>http://example.org/sayedBy</uri>
          </predicate>
          <object>
              <uri>http://example.org/alice</uri>
          </object>
        </triple>
      </binding>
    </result>
    <result>
      <binding name="x">
	      <triple>
          <subject>
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
          </subject>
          <predicate>
              <uri>http://example.org/sayedBy</uri>
          </predicate>
          <object>
              <uri>http://example.org/bob</uri>
          </object>
        </triple>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          {
            '?x': DF.quad(
              DF.quad(DF.namedNode('http://example.org/alice'), DF.namedNode('http://example.org/name'), DF.literal('Alice', DF.namedNode('http://example.org/Type'))),
              DF.namedNode('http://example.org/sayedBy'),
              DF.namedNode('http://example.org/alice'),
            ),
          },
          {
            '?x': DF.quad(
              DF.quad(DF.namedNode('http://example.org/bob'), DF.namedNode('http://example.org/name'), DF.literal('Bob', DF.namedNode('http://example.org/Type'))),
              DF.namedNode('http://example.org/sayedBy'),
              DF.namedNode('http://example.org/bob'),
            ),
          }
        ]);
    });

    it('should convert a SPARQL XML response with a single nested quoted triple binding in object', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
              <uri>http://example.org/alice</uri>
          </subject>
          <predicate>
              <uri>http://example.org/says</uri>
          </predicate>
          <object>
            <triple>
              <subject>
                  <uri>http://example.org/alice</uri>
              </subject>
              <predicate>
                  <uri>http://example.org/name</uri>
              </predicate>
              <object>
                  <literal datatype='http://example.org/Type'>Alice</literal>
              </object>
            </triple>
          </object>
        </triple>
      </binding>
    </result>
  </results>
</sparql>
`))))
        .toEqual([
          { '?x': DF.quad(
              DF.namedNode('http://example.org/alice'),
              DF.namedNode('http://example.org/says'),
              DF.quad(DF.namedNode('http://example.org/alice'), DF.namedNode('http://example.org/name'), DF.literal('Alice', DF.namedNode('http://example.org/Type'))),
            ) },
        ]);
    });

    it('should convert a SPARQL XML response with an empty result', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result />
  </results>
</sparql>
`))))
        .toEqual([{}]);
    });

    it('should convert a SPARQL XML response with an empty binding', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding />
    </result>
  </results>
</sparql>
`))))
        .toEqual([{}]);
    });

    it('should convert a SPARQL XML response and emit the variables', async () => {
      const stream = parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
    <variable name="hpage"/>
    <variable name="name"/>
    <variable name="age"/>
    <variable name="mbox"/>
    <variable name="friend"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <bnode>r1</bnode>
      </binding>
      <binding name="hpage">
	      <uri>http://work.example.org/bob1/</uri>
      </binding>
      <binding name="name">
	      <literal xml:lang="en">Bob1</literal>
      </binding>
      <binding name="age">
	      <literal datatype="http://www.w3.org/2001/XMLSchema#integer">1</literal>
      </binding>
      <binding name="mbox">
	      <uri>mailto:bob1@work.example.org</uri>
      </binding>
    </result>

    <result>
      <binding name="x">
	      <bnode>r2</bnode>
      </binding>
      <binding name="hpage">
	      <uri>http://work.example.org/bob2/</uri>
      </binding>
      <binding name="name">
	      <literal xml:lang="en">Bob2</literal>
      </binding>
      <binding name="age">
	      <literal datatype="http://www.w3.org/2001/XMLSchema#integer">2</literal>
      </binding>
      <binding name="mbox">
	      <uri>mailto:bob2@work.example.org</uri>
      </binding>
    </result>
  </results>
</sparql>
`));
      return expect(new Promise((resolve) => stream.on('variables', resolve))).resolves.toEqualRdfTermArray([
        DF.variable('x'), DF.variable('hpage'), DF.variable('name'), DF.variable('age'), DF.variable('mbox'), DF.variable('friend'),
      ]);
    });

    it('should emit an error on an erroring stream', async () => {
      const errorStream = new PassThrough();
      errorStream._read = () => errorStream.emit('error', new Error('Some stream error'));
      return expect(arrayifyStream(parser.parseXmlResultsStream(errorStream))).rejects.toBeTruthy();
    });

    it('should emit an error on an invalid XML response', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`
<?xml version="1.0"?>abc`)))).rejects.toBeTruthy();
    });

    it('should emit an error on a boolean response', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <boolean>false</boolean>
</sparql>`)))).rejects.toBeTruthy();
    });

    it('should emit an error on a empty XML', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
</sparql>`)))).rejects.toBeTruthy();
    });

    it('should support various kinds of empty bindings', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
    <variable name="hpage"/>
    <variable name="name"/>
    <variable name="age"/>
    <variable name="mbox"/>
    <variable name="friend"/>
  </head>
  <results>
    <result>
      <binding name="x" />
    </result>
    <result>
      <binding />
    </result>
    <result></result>
  </results>
</sparql>`)))).resolves.toBeTruthy();
    });

    it('should fail on binding with value but no name', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
    <variable name="hpage"/>
    <variable name="name"/>
    <variable name="age"/>
    <variable name="mbox"/>
    <variable name="friend"/>
  </head>
  <results>
    <result>
      <binding><literal></literal></binding>
    </result>
  </results>
</sparql>`)))).rejects.toBeTruthy();
    });

    it('should convert bindings with empty literals', async () => {
      return expect(await arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
        <literal></literal>
      </binding>
    </result>
  </results>
</sparql>
`)))).toEqual([{'?x': DF.literal("")}]);
    });

    it('should fail on invalid term type', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x"><foo>foo</foo></binding>
    </result>
  </results>
</sparql>`)))).rejects.toBeTruthy();
    });


    it('should not emit prefix question mark if requested', async () => {
      const customParser = new SparqlXmlParser({ prefixVariableQuestionMark: false });
      return expect(await arrayifyStream(customParser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
        <literal>foo</literal>
      </binding>
    </result>
  </results>
</sparql>
`))))
     .toEqual([{ 'x': DF.literal('foo') }]);
    });

    it('should throw on an illegal triple sub-tag', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
              <uri>http://example.org/alice</uri>
          </subject>
          <predicate>
              <uri>http://example.org/name</uri>
          </predicate>
          <object>
              <literal datatype='http://example.org/Type'>Alice</literal>
          </object>
          <illegal></illegal>
        </triple>
      </binding>
    </result>
  </results>
</sparql>`)))).rejects.toThrow(`Illegal quoted triple component 'illegal' found on line 20`);
    });

    it('should throw on an incomplete triple', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
              <uri>http://example.org/alice</uri>
          </subject>
          <predicate>
              <uri>http://example.org/name</uri>
          </predicate>
        </triple>
      </binding>
    </result>
  </results>
</sparql>`)))).rejects.toThrow(`Incomplete quoted triple on line 17`);
    });

    it('should throw on an multiple sub-tags in triple', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <head>
    <variable name="x"/>
  </head>
  <results>
    <result>
      <binding name="x">
	      <triple>
          <subject>
              <uri>http://example.org/alice</uri>
          </subject>
          <predicate>
              <uri>http://example.org/name</uri>
          </predicate>
          <predicate>
              <uri>http://example.org/name2</uri>
          </predicate>
          <object>
              <literal datatype='http://example.org/Type'>Alice</literal>
          </object>
        </triple>
      </binding>
    </result>
  </results>
</sparql>`)))).rejects.toThrow(`The predicate in a quoted triple on line 18 was already defined before`);
    });
  });

  describe('#parseXmlBooleanStream', () => {
    it('should reject on an empty SPARQL XML response', async () => {
      return expect(parser.parseXmlBooleanStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
</sparql>`))).rejects.toBeTruthy();
    });

    it('should reject on an invalid SPARQL XML response', async () => {
      return expect(parser.parseXmlBooleanStream(streamifyString(`
<?xml version="1.0"?>abc`))).rejects.toBeTruthy();
    });

    it('should convert a true SPARQL XML boolean response', async () => {
      return expect(await parser.parseXmlBooleanStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <boolean>true</boolean>
</sparql>`))).toEqual(true);
    });

    it('should convert a false SPARQL XML boolean response', async () => {
      return expect(await parser.parseXmlBooleanStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <boolean>false</boolean>
</sparql>`))).toEqual(false);
    });

    it('should reject a results payload', async () => {
      return expect(parser.parseXmlBooleanStream(streamifyString(`<?xml version="1.0"?>
<sparql xmlns="http://www.w3.org/2005/sparql-results#">
  <results></results>
</sparql>`))).rejects.toBeTruthy();
    });

    it('should reject on an erroring stream', async () => {
      const errorStream = new PassThrough();
      errorStream._read = () => errorStream.emit('error', new Error('Some stream error'));
      return expect(parser.parseXmlBooleanStream(errorStream)).rejects.toBeTruthy();
    });
  });
});
