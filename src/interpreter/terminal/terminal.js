import fs from 'fs';
import CodeGenerator from "../code-generator/code-generator.js";

import ErrorHandler from '../error-handler/error-handler.js';
import Interpreter from "../interpreter.js";
import Parser from "../parser/parser.js";
import Tokenizer from "../tokenizer/tokenizer.js";

class Terminal {
    processFile(filepath) {
        // console.log(new Interpreter.Service())
        // new Interpreter.Service()
        //     .add({
        //         consoleProvider: {
        //             read: null
        //             , write: console.log
        //         }
        //     })
        //     .search({
        //         what: filepath
        //         , searchType: Interpreter.FILE_INPUT
        //         , onStart: console.log(`Starting "search()" phase...`)
        //         , onEnd: console.log(`Ending "search()" phase...`)
        //         , onSuccess: console.log(`Main file found!`)
        //         , onFail: {
        //             INPUT_RELATED: ErrorHandler.handle(`The given path (${filepath}) is not of type text.`)
        //             , PATH_RELATED: ErrorHandler.handle(`The path to the given file (${filepath}) is invalid or does not represent the current address of any file.`)
        //             , EXTENSION_RELATED: ErrorHandler.handle(`The file with given path (${filepath}) is not of type '.tg' (Target file).`)
        //         }
        //     })
        //     .process({
        //         onStart: console.log(`Starting "process()" phase...`)
        //         , onEnd: console.log(`Ending "process()" phase...`)
        //         , onSuccess: console.log(`Program executed succesfully!`)
        //         , onFail: {
        //             USER_RELATED: ErrorHandler.handle(`The execution has stopped because of a program-generated error.`)
        //             , SERVICE_RELATED: ErrorHandler.handle(`The execution has stopped because of an unexpected Target Service error.`)
        //         }
        //     })
        //     .close();

        // if (typeof path !== "string") ErrorHandler.RuntimeError(`Path of file given to process is not of type text.`);
        // const data = fs.readFileSync(filepath);
        // // DO NOT FORGET: !!!!!! >>>>>>>>> 
        // return this.compile(data);
    }

    static process(text) {
        console.log('Interpreter:', typeof Interpreter, 'Service:', typeof Interpreter.Service)
        const service = new Interpreter.Service();

        service.add({
            providers: {
                console: {
                    read: null
                    , write: console.log
                    , error: ErrorHandler.Error
                }
            }
            , events: {
                onStart: () => console.log(`Adding "consoleProvider" module...`)
                , onEnd: () => console.log(`Finished "consoleProvider" add phase...`)
                , onSuccess: () => console.log(`All "consoleProvider" module components were added succesfully!`)
                , onFail: reason => console.log(`Errors appeared on module add: ${reason}`)
            }
        }).status()
            .search({
                what: Interpreter.input.TEXT
                , where: text
                , events: {
                    onStart: () => console.log(`Starting "search()" phase...`)
                    , onEnd: () => console.log(`Ending "search()" phase...`)
                    , onSuccess: () => console.log(`Text found!`)
                    , onFail: reason => console.log(`Errors appeared on search: ${reason}`)
                }
            }).status();

        const result = service.process({
            events: {
                onStart: () => console.log(`Starting "process()" phase...`)
                , onEnd: () => console.log(`Ending "process()" phase...`)
                , onSuccess: () => console.log(`Program executed succesfully!`)
                , onFail: reason => {
                    console.log(`Errors appeared on process: ${reason}`)
                    throw reason;
                }
            }
        }).result();
        service.close();
        return result;
    }
}

export default Terminal;