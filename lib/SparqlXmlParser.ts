import * as DefaultDataFactory from "@rdfjs/data-model";
import * as RDF from "rdf-js";
import {SparqlXmlBindingsTransformer} from "./SparqlXmlBindingsTransformer";
// tslint:disable-next-line:no-var-requires
const XmlNode = require('sax-stream');

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
    // Collect variables
    const variables: RDF.Variable[] = [];
    sparqlResponseStream
      .pipe(XmlNode({ strict: true, tag: 'variable' }))
      .on('data', (node: any) => variables.push(this.dataFactory.variable(node.attribs.name)))
      .on('error', () => { return; }) // Ignore errors, they will emitted in the results
      .on('finish', () => resultStream.emit('variables', variables));

    // Collect results
    const resultStream = sparqlResponseStream
      .pipe(XmlNode({ strict: true, tag: 'result' }))
      .on('error', (error: Error) => resultStream.emit('error', error))
      .pipe(new SparqlXmlBindingsTransformer(this));

    // Propagate errors
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
    if (rawBindings.children) {
      const bindingsArray = Array.isArray(rawBindings.children.binding)
        ? rawBindings.children.binding : [rawBindings.children.binding];
      for (const binding of bindingsArray) {
        if (binding.attribs && binding.children) {
          const key = binding.attribs.name;
          let value: RDF.Term = null;
          if (binding.children.bnode) {
            value = this.dataFactory.blankNode(binding.children.bnode.value);
          } else if (binding.children.literal) {
            if (binding.children.literal.attribs && binding.children.literal.attribs['xml:lang']) {
              value = this.dataFactory.literal(binding.children.literal.value,
                binding.children.literal.attribs['xml:lang']);
            } else if (binding.children.literal.attribs && binding.children.literal.attribs.datatype) {
              value = this.dataFactory.literal(binding.children.literal.value,
                this.dataFactory.namedNode(binding.children.literal.attribs.datatype));
            } else {
              value = this.dataFactory.literal(binding.children.literal.value);
            }
          } else {
            value = this.dataFactory.namedNode(binding.children.uri.value);
          }
          bindings[this.prefixVariableQuestionMark ? ('?' + key) : key] = value;
        }
      }
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
      sparqlResponseStream
        .pipe(XmlNode({ strict: true, tag: 'boolean' }))
        .on('error', reject)
        .on('data', (node: any) => resolve(node.value === 'true'))
        .on('end', () => reject(new Error('No valid ASK response was found.')));
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
