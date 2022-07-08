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

    it('should emit an error on an invalid XML response\'', async () => {
      return expect(arrayifyStream(parser.parseXmlResultsStream(streamifyString(`
<?xml version="1.0"?>abc`)))).rejects.toBeTruthy();
    });

    it('should emit an error when an unexpected error occurs in parseXmlBindings', async () => {
      parser.parseXmlBindings = null;
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
  </results>
</sparql>`)))).rejects.toBeTruthy();
    });
  });

  describe('#parseXmlBindings', () => {
    it('should convert bindings with no attributes', () => {
      const binding = {
        children: {
          binding: [
            {
              children: {
                uri: { value: 'http://example.org/book/book6' },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({});
    });

    it('should convert bindings with no children', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({});
    });

    it('should convert bindings with no attributes and children', () => {
      const binding = {
        children: {
          binding: [
            {
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({});
    });

    it('should convert bindings with named nodes', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
              children: {
                uri: { value: 'http://example.org/book/book6' },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding))
        .toEqual({ '?book': DF.namedNode('http://example.org/book/book6') });
    });

    it('should convert bindings with named nodes without variable prefixing', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
              children: {
                uri: { value: 'http://example.org/book/book6' },
              },
            },
          ],
        },
      };
      return expect(new SparqlXmlParser().parseXmlBindings(binding))
        .toEqual({ book: DF.namedNode('http://example.org/book/book6') });
    });

    it('should convert bindings with blank nodes', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
              children: {
                bnode: { value: 'abc' },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({ '?book': DF.blankNode('abc') });
    });

    it('should convert bindings with literals', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
              children: {
                literal: { value: 'abc' },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({ '?book': DF.literal('abc') });
    });

    it('should convert bindings with empty literals', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
              children: {
                literal: { value: '' },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({ '?book': DF.literal('') });
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
        `))))
        .toEqual([{ '?x': DF.literal("") }]);
    });

    it('should convert bindings with languaged literals', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
              children: {
                literal: { value: 'abc', attribs: { 'xml:lang': 'en-us' } },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({ '?book': DF.literal('abc', 'en-us') });
    });

    it('should convert bindings with datatyped literals', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book' },
              children: {
                literal: { value: 'abc', attribs: { datatype: 'http://ex' } },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({ '?book': DF.literal('abc', DF.namedNode('http://ex')) });
    });

    it('should convert mixed bindings', () => {
      const binding = {
        children: {
          binding: [
            {
              attribs: { name: 'book1' },
              children: {
                uri: { value: 'http://example.org/book/book6' },
              },
            },
            {
              attribs: { name: 'book2' },
              children: {
                bnode: { value: 'abc' },
              },
            },
            {
              attribs: { name: 'book3' },
              children: {
                literal: { value: 'abc' },
              },
            },
            {
              attribs: { name: 'book4' },
              children: {
                literal: { value: 'abc', attribs: { 'xml:lang': 'en-us' } },
              },
            },
            {
              attribs: { name: 'book5' },
              children: {
                literal: { value: 'abc', attribs: { datatype: 'http://ex' } },
              },
            },
          ],
        },
      };
      return expect(parser.parseXmlBindings(binding)).toEqual({
        '?book1': DF.namedNode('http://example.org/book/book6'),
        '?book2': DF.blankNode('abc'),
        '?book3': DF.literal('abc'),
        '?book4': DF.literal('abc', 'en-us'),
        '?book5': DF.literal('abc', DF.namedNode('http://ex')),
      });
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

    it('should reject on an erroring stream', async () => {
      const errorStream = new PassThrough();
      errorStream._read = () => errorStream.emit('error', new Error('Some stream error'));
      return expect(parser.parseXmlBooleanStream(errorStream)).rejects.toBeTruthy();
    });
  });
});
