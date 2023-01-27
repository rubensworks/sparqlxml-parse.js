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
    let variablesFound = false;
    let resultsFound = false;
    const variables: RDF.Variable[] = [];
    let currentBindings: IBindings = {};
    let currentBindingName: string = '';
    let currentBindingType: string = '';
    let currentBindingAnnotation: string | RDF.NamedNode | undefined;
    let currentText: string = '';
    let currentQuotedTriples: { currentComponent?: 'subject' | 'predicate' | 'object'; components: { subject?: RDF.Term; predicate?: RDF.Term; object?: RDF.Term } }[] = [];
    parser.on("error", errorListener);
    parser.on("opentag", tag => {
      if(tag.name === "variable" && this.stackEquals(stack,['sparql', 'head'])) {
        variables.push(this.dataFactory.variable(tag.attributes.name));
      } else if(tag.name === "results" && this.stackEquals(stack, ['sparql'])) {
        resultsFound = true;
      } else if(tag.name === 'result' && this.stackEquals(stack, ['sparql', 'results'])) {
        currentBindings = {};
      } else if(tag.name === 'binding' && this.stackEquals(stack, ['sparql', 'results', 'result'])) {
        currentBindingName = tag.attributes.name || '';
        currentBindingType = '';
        currentBindingAnnotation = '';
        currentText = '';
        currentQuotedTriples = [];
      } else if(tag.name === 'triple' && this.stackBeginsWith(stack, ['sparql', 'results', 'result'])) {
        currentQuotedTriples.push({ components: {} });
      } else if (stack[stack.length - 1] === 'triple' && this.stackBeginsWith(stack, ['sparql', 'results', 'result', 'binding'])) {
        currentBindingType = '';
        currentBindingAnnotation = '';
        currentText = '';
        if (!['subject', 'predicate', 'object'].includes(tag.name)) {
          errorListener(new Error(`Illegal quoted triple component '${tag.name}' found on line ${parser.line + 1}`));
        } else {
          currentQuotedTriples[currentQuotedTriples.length - 1].currentComponent = <any>tag.name;
        }
      } else if(this.stackBeginsWith(stack, ['sparql', 'results', 'result', 'binding'])) {
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
        variablesFound = true;
      }
      if(this.stackEquals(stack, ['sparql', 'results', 'result'])) {
        resultStream.push(currentBindings);
      }
      if(this.stackBeginsWith(stack, ['sparql', 'results', 'result', 'binding'])) {
        // Determine current RDF term value
        let term: RDF.Term | undefined;
        if(!currentBindingName && currentBindingType) {
          errorListener(new Error(`Terms should have a name on line ${parser.line + 1}`));
        } else if(currentBindingType === 'uri') {
          term = this.dataFactory.namedNode(currentText);
        } else if(currentBindingType === 'bnode') {
          term = this.dataFactory.blankNode(currentText);
        } else if (currentBindingType === 'literal') {
          term = this.dataFactory.literal(currentText, currentBindingAnnotation);
        } else if (stack[stack.length - 1] === 'triple') {
          const currentQuotedTriple = currentQuotedTriples.pop();
          if (currentQuotedTriple && currentQuotedTriple.components.subject && currentQuotedTriple.components.predicate && currentQuotedTriple.components.object) {
            term = this.dataFactory.quad(
              <RDF.Quad_Subject> currentQuotedTriple.components.subject,
              <RDF.Quad_Predicate> currentQuotedTriple.components.predicate,
              <RDF.Quad_Object> currentQuotedTriple.components.object,
            );
          } else {
            errorListener(new Error(`Incomplete quoted triple on line ${parser.line + 1}`));
          }
        } else if(currentBindingType) {
          errorListener(new Error(`Invalid term type '${currentBindingType}' on line ${parser.line + 1}`));
        }

        if (term) {
          if (currentQuotedTriples.length > 0) {
            // If we're in a quoted triple, store the term inside the active quoted triple
            const currentQuotedTriple = currentQuotedTriples[currentQuotedTriples.length - 1];
            if (currentQuotedTriple.components[currentQuotedTriple.currentComponent]) {
              errorListener(new Error(`The ${currentQuotedTriple.currentComponent} in a quoted triple on line ${parser.line + 1} was already defined before`));
            }
            currentQuotedTriple.components[currentQuotedTriple.currentComponent] = term;
          } else {
            // Store the value in the current bindings object
            const key = this.prefixVariableQuestionMark ? ('?' + currentBindingName) : currentBindingName;
            currentBindings[key] = term;
          }
        }

        currentBindingType = undefined;
      }
      stack.pop();
    })
    parser.on("text", text => {
      if(this.stackBeginsWith(stack, ['sparql', 'results', 'result', 'binding']) && stack[stack.length - 1] === currentBindingType) {
        currentText = text;
      }
    })

    const resultStream = sparqlResponseStream
        .on("end", _ => {
          if (!resultsFound) {
            resultStream.emit("error", new Error("No valid SPARQL query results were found."))
          } else if (!variablesFound) {
            resultStream.emit('variables', []);
          }
        })
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

  private stackBeginsWith(a: string[], b: string[]) {
    return a.length >= b.length && b.every((v, i) => a[i] === v);
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
