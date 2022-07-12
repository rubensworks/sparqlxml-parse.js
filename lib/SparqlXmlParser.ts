import {DataFactory} from "rdf-data-factory";
import * as RDF from "@rdfjs/types";
import {SaxesParser} from "saxes";
import {Transform} from "readable-stream";

/**
 * Parser for the SPARQL Query Results XML format.
 * @see https://www.w3.org/TR/rdf-sparql-XMLres/
 */
export class SparqlXmlParser {

  private readonly dataFactory: RDF.DataFactory;
  private readonly prefixVariableQuestionMark?: boolean;

  constructor(settings?: ISettings) {
    settings = settings || {};
    this.dataFactory = settings.dataFactory || new DataFactory();
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
    const errorListener = (error: Error) => resultStream.emit('error', error);
    sparqlResponseStream.on('error', errorListener);

    const parser = new SaxesParser();
    const stack: string[] = [];
    const variables: RDF.Variable[] = [];
    let currentBindings: IBindings = {};
    let currentBindingName: string = '';
    let currentBindingType: string = '';
    let currentBindingAnnotation: string | RDF.NamedNode | undefined;
    let currentText: string = '';
    parser.on("error", errorListener);
    parser.on("opentag", tag => {
      if(tag.name === "variable" && this.stackEquals(stack,['sparql', 'head'])) {
        variables.push(this.dataFactory.variable(tag.attributes.name));
      } else if(tag.name === 'result' && this.stackEquals(stack, ['sparql', 'results'])) {
        currentBindings = {};
      } else if(tag.name === 'binding' && this.stackEquals(stack, ['sparql', 'results', 'result'])) {
        currentBindingName = tag.attributes.name || '';
        currentBindingType = '';
        currentBindingAnnotation = '';
        currentText = '';
      } else if(this.stackEquals(stack, ['sparql', 'results', 'result', 'binding'])) {
        currentBindingType = tag.name;
        if('xml:lang' in tag.attributes) {
          currentBindingAnnotation = tag.attributes['xml:lang'];
        } else if('datatype' in tag.attributes) {
          currentBindingAnnotation = this.dataFactory.namedNode(tag.attributes.datatype);
        } else {
          currentBindingAnnotation = undefined;
        }
      }
      stack.push(tag.name);
    })
    parser.on("closetag", tag => {
      if(this.stackEquals(stack, ['sparql', 'head'])) {
        resultStream.emit("variables", variables);
      }
      if(this.stackEquals(stack, ['sparql', 'results', 'result'])) {
        resultStream.push(currentBindings);
      }
      if(this.stackEquals(stack, ['sparql', 'results', 'result', 'binding'])) {
        const key = this.prefixVariableQuestionMark ? ('?' + currentBindingName) : currentBindingName;
        if(!currentBindingName && currentBindingType) {
          errorListener(new Error(`Terms should have a name on line ${parser.line + 1}`));
        } else if(currentBindingType === 'uri') {
          currentBindings[key] = this.dataFactory.namedNode(currentText);
        } else if(currentBindingType === 'bnode') {
          currentBindings[key] = this.dataFactory.blankNode(currentText);
        } else if (currentBindingType === 'literal') {
          currentBindings[key] = this.dataFactory.literal(currentText, currentBindingAnnotation);
        } else if(currentBindingType) {
          errorListener(new Error(`Invalid term type '${currentBindingType}' on line ${parser.line + 1}`));
        }
      }
      stack.pop();
    })
    parser.on("text", text => {
      if(this.stackEquals(stack, ['sparql', 'results', 'result', 'binding', currentBindingType])) {
        currentText = text;
      }
    })

    const resultStream = sparqlResponseStream
        .pipe(new Transform({
          objectMode: true,
          transform(chunk: any, encoding: string, callback: (error?: Error | null, data?: any) => void) {
            parser.write(chunk);
            callback();
          }
        }));
    return resultStream;
  }

  /**
   * Convert a SPARQL XML boolean response stream to a promise resolving to a boolean.
   * This will reject if the given response was not a valid boolean response.
   * @param {NodeJS.ReadableStream} sparqlResponseStream A SPARQL XML response stream.
   * @return {Promise<boolean>} The response boolean.
   */
  public parseXmlBooleanStream(sparqlResponseStream: NodeJS.ReadableStream): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const parser = new SaxesParser();
      const stack: string[] = [];
      parser.on("error", reject);
      parser.on("opentag", tag => {
        stack.push(tag.name);
      })
      parser.on("closetag", _ => {
        stack.pop();
      })
      parser.on("text", text => {
        if(this.stackEquals(stack, ['sparql', 'boolean'])) {
          resolve(text === 'true');
        }
      })
      sparqlResponseStream
          .on('error', reject)
          .on('data', d => parser.write(d))
          .on('end', () => reject(new Error('No valid ASK response was found.')));
    });
  }

  private stackEquals(a: string[], b: string[]) {
    return a.length === b.length && a.every((v, i) => b[i] === v);
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
