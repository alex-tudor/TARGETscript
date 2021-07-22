import CodeGenerator from "./code-generator/code-generator";
import ErrorHandler from "./error-handler/error-handler";
import Parser from "./parser/parser";
import Tokenizer from "./tokenizer/tokenizer";
import fs from 'fs';

// TODO: recheck all ?. and ?? {}

export default (() => {
    const constants = {
        input: {
            TEXT: Symbol(),
            FILEPATH: Symbol()
        }
    }

    const Service = (() => {
        let setup = {
              closed: true
            , data: null
            , result: null
            , components: {}
            , providers: {
                console: {}
            }
        };

        class Service {
            constructor() {
                setup.closed = false;
            }

            add({
                components: {
                      tokenizer
                    , parser
                    , generator
                } = {}
                , providers: {
                    console: {
                          read
                        , write
                        , error
                    } = {}
                } = {}
                , events: {
                      onStart
                    , onSuccess
                    , onFail
                    , onEnd
                } = {}
            } = {}) {
                return (
                    setup.closed
                        ? onFail?.(`This service is closed and cannot execute any operations.`)
                        : (
                            onStart?.()
                            , ( tokenizer === null || tokenizer instanceof Tokenizer     ) && ( setup.components.tokenizer    = tokenizer )
                            , ( parser    === null || parser    instanceof Parser        ) && ( setup.components.parser       = parser    )
                            , ( generator === null || generator instanceof CodeGenerator ) && ( setup.components.generator    = generator )
                            , ( read      === null || typeof read  === `function`        ) && ( setup.providers.console.read  = read      )
                            , ( write     === null || typeof write === `function`        ) && ( setup.providers.console.write = write     )
                            , ( error     === null || typeof error === `function`        ) && ( setup.providers.console.error = error     )
                            , onSuccess?.()
                            , onEnd?.()
                        )
                    , this
                );
            }

            search({
                  what
                , where
                , events: {
                      onStart
                    , onSuccess
                    , onFail
                    , onEnd
                } = {}
            } = {}) {
                if (setup.closed) {
                    console.log("This service is closed and cannot execute any further operations.");
                    return this;
                }

                onStart?.();

                switch (what) {
                    case constants.input.TEXT:
                        if (typeof where !== 'string') {
                            onFail?.(`The given text ( ${where} ) is not of type string.`);
                            break;
                        }
                        setup.data = where;
                        onSuccess?.();
                        break;
                    case constants.input.FILEPATH:
                        if (typeof where !== "string") {
                            onFail?.(`The given path ( ${where} ) is not of type string.`);
                            break;
                        }
                        let data;
                        try {
                            data = fs.readFileSync(where);
                        } catch {
                            onFail?.(`There was an error reading the file at the given path ( ${where} ).`);
                            break;
                        }
                        setup.data = data;
                        onSuccess?.();
                        break;
                    default:
                        onFail?.(`The given input type was not among the expected input types { TEXT | FILEPATH }.`)
                }
                onEnd?.();
                return this;
            }

            process({
                events: {
                    onStart
                    , onEnd
                    , onSuccess
                    , onFail
                } = {}
            } = {}) {
                if (setup.closed) {
                    console.log("This service is closed and cannot execute any further operations.");
                    return this;
                }
                onStart?.();
                
                
                !(setup.components?.tokenizer instanceof Tokenizer)     && this.add({ components: { tokenizer: new Tokenizer()                                  } })
                !(setup.components?.parser    instanceof Parser)        && this.add({ components: { parser:    new Parser()                                     } })
                !(setup.components?.generator instanceof CodeGenerator) && this.add({ components: { generator: new CodeGenerator(setup.providers.console ?? {}) } })
                
                let { tokenizer, parser, generator } = setup.components;

                console.log(setup.components)

                try {
                    setup.result = generator.eval(parser.parse(tokenizer.tokenize( setup.data )));
                } catch (e) {
                    onFail?.(e); // user generated errors
                    onEnd?.();
                    throw e; // throw to stop program execution
                }
                onSuccess?.();
                onEnd?.();
                return this;
            }

            close() {
                return (
                    setup.closed
                        ? console.log("This service has been already closed in the past.")
                        : setup = {
                            closed: true
                            , data: null
                            , result: null
                            , components: {}
                            , providers: {
                                console: {}
                            }
                        }
                    , this
                );
            }

            status() {
                return (
                    setup.closed
                        ? console.log("This service has been already closed in the past.")
                        : console.log(setup)
                    , this
                );   
            }

            result() {
                return (
                    setup.closed
                        ? ( console.log("This service has been already closed in the past."), this )
                        : setup.result
                );   
            }
        }

        return Service;
    })();
    
    return { Service, ...constants };
})();