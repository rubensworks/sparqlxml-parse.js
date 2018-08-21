import * as DefaultDataFactory from "@rdfjs/data-model";
import * as RDF from "rdf-js";
import {Readable} from "stream";
import {SparqlXmlBindingsTransformer} from "./SparqlXmlBindingsTransformer";
// tslint:disable-next-line:no-var-requires
const XmlStream = require('xml-stream');

/**
 * Parser for the SPARQL Query Results XML format.
 * @see https://www.w3.org/TR/rdf-sparql-XMLres/
 */
export class SparqlXmlParser {

  private readonly dataFactory: RDF.DataFactory;
  private readonly prefixVariableQuestionMark?: boolean;

  constructor(settings?: ISettings) {
    settings = settings || {};
    this.dataFactory = settings.dataFactory || DefaultDataFactory;
    this.prefixVariableQuestionMark = !!settings.prefixVariableQuestionMark;
  }

  /**
   * Convert a SPARQL XML bindings response stream to a stream of bindings objects.
   *
   * The bindings stream will emit a 'variables' event that will contain
   * the array of variables (as RDF.Variable[]), as defined in the response head.
   *
   * @param {NodeJS.ReadableStream} sparqlResponseStream A SPARQL XML response stream.
   * @return {NodeJS.ReadableStream} A stream of bindings.
   */
  public parseXmlResultsStream(sparqlResponseStream: NodeJS.ReadableStream): NodeJS.ReadableStream {
    const variables: RDF.Variable[] = [];

    const rawResultStream = new Readable({ objectMode: true });
    rawResultStream._read = () => { return; };

    const xmlParser = new XmlStream(sparqlResponseStream);
    xmlParser.collect('binding', true);
    xmlParser.on('error', (error: Error) => resultStream.emit('error', error));
    xmlParser.on('endElement: head > variable', (node: any) => variables.push(this.dataFactory.variable(node.$.name)));
    xmlParser.on('endElement: results result',  (bindings: any) => rawResultStream.push(bindings));
    xmlParser.on('end', () => {
      resultStream.emit('variables', variables);
      rawResultStream.push(null);
    });

    const resultStream = rawResultStream.pipe(new SparqlXmlBindingsTransformer(this));
    sparqlResponseStream.on('error', (error) => resultStream.emit('error', error));
    return resultStream;
  }

  /**
   * Convert a SPARQL XML result binding to a bindings object.
   * @param rawBindings A SPARQL XML result binding.
   * @return {IBindings} A bindings object.
   */
  public parseXmlBindings(rawBindings: any): IBindings {
    const bindings: IBindings = {};
    for (const binding of rawBindings.binding) {
      const key = binding.$.name;
      let value: RDF.Term = null;
      if (binding.bnode) {
        value = this.dataFactory.blankNode(binding.bnode);
      } else if (binding.literal) {
        if (binding.literal.$ && binding.literal.$['xml:lang']) {
          value = this.dataFactory.literal(binding.literal.$text, binding.literal.$['xml:lang']);
        } else if (binding.literal.$ && binding.literal.$.datatype) {
          value = this.dataFactory.literal(binding.literal.$text,
            this.dataFactory.namedNode(binding.literal.$.datatype));
        } else {
          value = this.dataFactory.literal(binding.literal);
        }
      } else {
        value = this.dataFactory.namedNode(binding.uri);
      }
      bindings[this.prefixVariableQuestionMark ? ('?' + key) : key] = value;
    }
    return bindings;
  }

  /**
   * Convert a SPARQL XML boolean response stream to a promise resolving to a boolean.
   * This will reject if the given reponse was not a valid boolean response.
   * @param {NodeJS.ReadableStream} sparqlResponseStream A SPARQL XML response stream.
   * @return {NodeJS.ReadableStream} A stream of bindings.
   */
  public parseXmlBooleanStream(sparqlResponseStream: NodeJS.ReadableStream): Promise<boolean> {
    return new Promise((resolve, reject) => {
      sparqlResponseStream.on('error', reject);
      const xmlParser = new XmlStream(sparqlResponseStream);
      xmlParser.on('error', reject);
      xmlParser.on('endElement: boolean', (node: any) => resolve(node.$text === 'true'));
      xmlParser.on('end', () => reject(new Error('No valid ASK response was found.')));
    });
  }

}

/**
 * Constructor settings object interface for {@link SparqlXmlParser}.
 */
export interface ISettings {
  /**
   * A custom datafactory.
   */
  dataFactory?: RDF.DataFactory;
  /**
   * If variable names should be prefixed with a quotation mark.
   */
  prefixVariableQuestionMark?: boolean;
}

/**
 * A bindings object.
 */
export interface IBindings {
  [key: string]: RDF.Term;
}
