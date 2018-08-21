import {Transform, TransformCallback} from "stream";
import {SparqlXmlParser} from "./SparqlXmlParser";

/**
 * Transforms a stream of SPARQL JSON bindings object to parsed bindings.
 */
export class SparqlXmlBindingsTransformer extends Transform {

  private readonly parser: SparqlXmlParser;

  constructor(parser: SparqlXmlParser) {
    super({ objectMode: true });
    this.parser = parser;
  }

  public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    callback(null, this.parser.parseXmlBindings(chunk));
  }

}
