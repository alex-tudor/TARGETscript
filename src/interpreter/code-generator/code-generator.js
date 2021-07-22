// operatorii "AND" si "OR" NU sunt scurtcircuitati in Target
// change typeofs into custom type() function (because expressions could be identifiers / function calls)
// create ErrorStmt and PrintStmt

// REPAIR: repair Generator in the case of `` identifiers
// DEBATE: prohibit or not function redeclaration in the same env (will it create problems with overriding / overloading?)
//      PRO: technially speaking, ```func name(a, b, c): <code> <=> let name = (a, b, c => <code>)() 

// TODO: fulfill validType questioning inside (each global function -print -error) given below
// TODO: introduce 'are', 'are not' operators in the future as equivalents of 'is', 'is not'

import ErrorHandler from '../error-handler/error-handler.js';
import Environment from '../code-generator/environment.js';
import Terminal from '../terminal/terminal.js';

export default class CodeGenerator {
    constructor({ read, write, error } = {}) {
        this.global = new Environment({
            'nothing': null,
            'true': true,
            'false': false,
            // TODO: IMPLEMENT:
            // , read: (1 or more arguments, gather them with ... operator) => { call read function given above as argument }
            'print': (...args) => {
                args.length >= 1 || ErrorHandler.RuntimeError(`"print" function requires at least 1 argument.`);
                debugger;
                write?.(
                    args.map(arg => arg ?? 'nothing')
                        .join(' ')
                );
                debugger;
                return null; // return null or nothing???
            }
            , 'error': message => {
                typeof message === "undefined"
                    ? error?.('An error occured.')
                    : error?.((message === null && 'nothing') || (message === true && 'true') || (message === false && 'false') || message);
                return null;
            }
            , 'and': (first, second) => {
                if (typeof first === "boolean" && typeof second === "boolean") return first && second;
                ErrorHandler.RuntimeError("Bad operand types for the 'and' operator."); // TODO: DEBATE: ar trebui sa schimbam aici cu error, iar la definitia lui error, cu RuntimeError in loc de Error ?
            },
            'or': (first, second) => {
                if (typeof first === "boolean" && typeof second === "boolean") return first || second;
                ErrorHandler.RuntimeError("Bad operand types for the 'or' operator."); 
            },
            'is': (first, second) => {
                const validTypes = [
                    ['logical', 'logical'],
                    ['logical', 'nothing'],

                    ['numeric', 'numeric'],
                    ['numeric', 'nothing'],

                    ['text', 'text'],
                    ['text', 'nothing'],

                    ['nothing', 'logical'],
                    ['nothing', 'numeric'],
                    ['nothing', 'text'],
                    ['nothing', 'nothing']
                ];
                if (validTypes.some(arr => arr[0] === this.type(first) && arr[1] === this.type(second)))
                    return first === second;

                ErrorHandler.RuntimeError(`Bad operand types for the 'is' operator: ${this.type(first)}, ${this.type(second)}`);
            },
            'is not': (first, second) => {
                const validTypes = [
                    ['logical', 'logical'],
                    ['logical', 'nothing'],

                    ['numeric', 'numeric'],
                    ['numeric', 'nothing'],

                    ['text', 'text'],
                    ['text', 'nothing'],

                    ['nothing', 'logical'],
                    ['nothing', 'numeric'],
                    ['nothing', 'text'],
                    ['nothing', 'nothing']
                ];
                if (validTypes.some(arr => arr[0] === this.type(first) && arr[1] === this.type(second)))
                    return first !== second;

                ErrorHandler.RuntimeError(`Bad operand types for the 'is not' operator: ${this.type(first)}, ${this.type(second)}`);
            },
            '<': (op1, op2) => {
                if (typeof first === "number" && typeof second === "number") return op1 < op2; // if op1 sau op2 === boolean expressions (true sau false), throw error (cannot compare number with logical value)
                ErrorHandler.RuntimeError("Bad operand types for the 'is' operator.");
            },
            '<=': (op1, op2) => op1 <= op2, // la fel si aici
            '>': (op1, op2) => op1 > op2,  // la fel si aici
            '>=': (op1, op2) => op1 >= op2,  // la fel si aici
            'binary +': (first, second) => {
                if (typeof first === "number" && typeof second === "number") return first + second;
                // TODO: add comparation between strings using a custom type() function
                // if one of them is string, do concatenation
                ErrorHandler.RuntimeError("Bad operand types for the 'binary +' operator.");
            },
            'binary -': (first, second) => {
                if (typeof first === "number" && typeof second === "number") return first - second;
                // TODO: add comparation between strings using a custom type() function
                ErrorHandler.RuntimeError("Bad operand types for the 'binary -' operator.");
            },
            '*': (op1, op2) => op1 * op2,  // de facut cazul op1.type === string si op2.type = number (multiplicarea stringului)
            '/': (op1, op2) => {
                if (op2 === 0) ErrorHandler.RuntimeError(`Division with second operand equal to 0.`);
                return op1 / op2;
            },
            'unary +': operand => {
                if (typeof operand === "number") return operand;
                // TODO: add comparation between strings using a custom type() function
                ErrorHandler.RuntimeError("Bad operand type for the 'unary +' operator.");
            }, // if op1 sau op2 === boolean expressions (true sau false), throw error (cannot { unary minus | subtraction } to a a logical value)
            'unary -': operand => {
                if (typeof operand === "number") return -operand;
                // TODO: add comparation between strings using a custom type() function
                ErrorHandler.RuntimeError("Bad operand type for the 'unary -' operator.");
            }, // if op1 sau op2 === boolean expressions (true sau false), throw error (cannot { unary minus | subtraction } to a a logical value)
            'not': op1 => !(op1 !== false), // be sure op1 is a boolean, bcz it might be nothing or object / list (verify with !== on true and false)
        });

        this.exports = {};
    }

    isNum(expr) {
        return typeof expr === "number";
    }
    isStr(expr) {
        return typeof expr === "string" && /^(?:".*")$/.test(expr);
    }
    isOp(expr) {
        return typeof expr === "string" && /^(?:(?:binary \+)|(?:binary \-)|(?:unary \+)|(?:unary \-)|\*|\/|\>|\<|\>\=|\<\=|is|is not|and|or|not)$/.test(expr); // isnt instead or is not
    }
    isVar(expr) {
        return typeof expr === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(expr);
    }
    isSpacedVar(expr) {
        return typeof expr === "string" && /^(?:`[A-Za-z0-9_ ]+`)$/.test(expr); // + in regex may be changed to * if it is decided that empty 'spaced' identifiers (which is kind of a paradox) could exist as a valid component of Target
    }

    type(expr) {
        if (expr === null) return "nothing";
        if (expr === true || expr === false) return "logical";
        if (typeof expr === "number") return "numeric";
        if (typeof expr === "string") return "text";
        if (typeof expr === "object") {
            if (expr.hasOwnProperty("body")
                && expr.hasOwnProperty("env")
                && expr.hasOwnProperty("params")
                && typeof expr.params === "object"
                && expr.params.hasOwnProperty("regular")
               /**/ && expr.params.regular.constructor.name === "Array"
                && expr.params.hasOwnProperty("named")
               /**/ && expr.params.named.constructor.name === "Array"
            ) {
                return "function";
            }
        }
        /* CHANGE: REPAIR: */ return 'other';
    }

    generate(input) {
        if (typeof input !== "object" || input.constructor.name !== "Array")
            ErrorHandler.InternalError("Input given to the Code Generator is not of type 'array'.");

        return this.eval(input);
    }

    // waitFetch(path) {
    //     let fetchPromise = fetch('path');
    //     let i = window.setInterval(() => {
    //         console.log(fetchPromise)
    //     }, 1);
    //     fetchPromise.then(response => { window.clearInterval(i); console.log('resolved', fetchPromise, response.text()) })
    // }

    // getExportData(path) {
    //     let fetch = this.waitFetch(path);
    // fetch(path)
    //     .catch(_ => { ErrorHandler.RuntimeError(`File with path \"${path}\", given to import, does not exist inside this project.`); })
    //     .then(() => { console.log('HI') })
    //     .catch(_ => { ErrorHandler.RuntimeError('Error 2'); })
    //     .then(() => { console.log('HI 2') });
    // console.log(response);
    // if(!response.ok) 
    // let text = await response.text();
    // console.log(text);
    // let generator = Terminal.compile(text)
    // console.log(generator);
    // .catch(() => {  })
    // .then(response => response.text())
    // .then(text => Terminal.compile(text))
    // .then(generator => generator.exports)
    // console.log(response);
    // await fetchResult.then(response => response.text())
    // .then(Terminal.compile).then(result => { exportObject = result })
    // : `Name of file given to process is not of type text.`;

    // return Terminal.process(address).exports
    // console.log(address);
    // let generator = new Generator();
    // let fetchResult = fetch(address.slice(1, -1)).catch(() => {
    //     ErrorHandler.RuntimeError(`File with file address \"${address}\", given to import, does not exist in this project.`)
    // });

    // }

    // for 'use', last solution:
    // make eval() async
    // replace '(?<!\/\/.*)this.eval\(' with 'await this.call('



    // TODO: review if "use" works and behaves properly, not tested enough times
    eval(expr, env = this.global) {
        if (Array.isArray(expr)) {

            /**
             * @syntax      [use <path> <components>]
             * @description Imports one or more components from a Target file.
             */
            if (expr[0] === "use") {

                let [_use, path, components] = expr;
                path = this.eval(path, env);
                if (!path.endsWith('.tg')) // maybe we can implement a switch here
                    ErrorHandler.RuntimeError("You cannot import a file which does not have the extension '.tg'")

                const { exports } = Terminal.processFile(path); // processFile() is not ready yet
                for (const component of components) {
                    try {
                        // should check so that variables with this identifier didnt already existed inside the instruction block
                        env.defineConstant(component, exports[component]);
                    } catch (error) {
                        // a more specific error will be thrown
                        ErrorHandler.RuntimeError(`Import conflict: a variable with name \`${component}\` has already been declared before this 'use' statement.`);
                    }
                }

                return null;
            }

            /**
             * @syntax      [export ...<components>]
             * @description Exports one or more components from the current Target file.
             */
            if (expr[0] === "export") {
                const [_export, ...components] = expr;
                for (const name of components) {
                    Object.defineProperty(this.exports, name, {
                        value: this.eval(name, env)
                        , enumerable: true
                        // , configurable: false // default value
                        // , writable: false     // default value
                    });
                }
                return null;
            }

            /**
             * @syntax      [var ...<variables>]
             * @description Creates one or more variables with the given names and values.
             */
            if (expr[0] === "var") {
                if (Array.isArray(expr[1])) {
                    const [_var, ...variables] = expr;
                    for (const [name, value] of variables) {
                        typeof value === "undefined"
                            ? env.define(name, null)
                            : env.define(name, this.eval(value, env));
                    }
                }
                return null;
            }

            /**
            * @syntax      [const ...<constants>]
            * @description Creates one or more constants with the given names and values.
            */
            if (expr[0] === "const") {
                if (Array.isArray(expr[1])) {
                    const [_const, ...constants] = expr;
                    for (const [name, value] of constants) {
                        env.defineConstant(name, this.eval(value, env));
                    }
                }
                return null;
            }

            // /**
            //  * @syntax      [type <expression>]
            //  * @description Returns the type of a given expression
            //  */
            if (expr[0] === "type") {
                let [_type, expression] = expr;
                expression = this.eval(expression, env);
                return this.type(expression);
            }

            /**
             * @syntax      [assign <name> <value>]
             * @syntax      [assign [prop <entity> <property>] <value>]
             * @description Assigns the given value to the given variable / property of an entity
             */
            if (expr[0] === "assign") {
                if (Array.isArray(expr[1]) && expr[1][0] === "prop") {
                    const [_assign, [_prop, entity, property], value] = expr;
                    const entityEnv = this.eval(entity, env);
                    // the below instruction works like an assign (TODO: to be changed when introducing constant expressions, introduce constants with try-catch on javascript defineProperty(writable = true))
                    // assign() is not used because it 'looks' further than the entityEnv if property is not found inside the entityEnv
                    // TODO: DEBATE: select 1 of 2 options:
                    // - assign(name, value, TTL), getVarEnv receives TTL, if TTL gets 0, then Error. TTL will be 1 for entityEnv
                    // - define(name, value) with try-catch on both assignments, will catch variables where writable=true throws error, so that JS will tell you they should be constant
                    return entityEnv.define(property, this.eval(value, env));
                } else {
                    const [_assign, name, value] = expr;
                    return env.assign(name, this.eval(value, env));
                }
            }

            /**
             * @syntax      [begin ...<body>]
             * @description Evaluates a code block
             */
            if (expr[0] === "begin") {
                const [_begin, ...body] = expr;
                return this.evalMultiple(body, env);
            }

            /**
             * @syntax      [arrow <regular> <named> (<statement> | [begin ...<body>])]
             * @description Creates an anonymous function with the given regular parameters, named parameters and body
             * TODO: make arrows to be like functions, but without name
             */
            if (expr[0] === "arrow") {
                let [_arrow, regular, named, statement] = expr;

                regular = regular.map(obj => (obj.value = this.eval(obj.value, env), obj));
                named = named.map(obj => (obj.value = this.eval(obj.value, env), obj));
                // [ {name: a, value: 1}, {name: b, value: 2} ]
                // { a: 1, b: 2 }

                // console.log(regular);

                // regular = Object.fromEntries(regular.map(obj => [ obj.name, obj.value ]))

                // console.log(regular);

                // named = Object.fromEntries(Object.entries(named).map(([key, value]) => [/^(?:`[A-Za-z0-9 ]`)$/.test(key) ? key.slice(1, -1) : key, value]))

                if (Array.isArray(statement) && statement[0] === "begin") {
                    const [_begin, ...body] = statement;
                    return {
                        params: { regular, named },
                        body: body,
                        env
                    };
                }
                return {
                    params: { regular, named },
                    body: [statement],
                    env
                };
            }

            /**
             * @syntax      [func <name> <regular> <named> (<statement> | [begin ...<body>])]
             * @description Creates a function with the given name, regular parameters, named parameters and body
             */
            if (expr[0] === "func") {
                const [_func, name, regular, named, statement] = expr;
                let result;
                try {
                    result = env.defineConstant(name, this.eval(["arrow", regular, named, statement]));
                } catch (error) {
                    ErrorHandler.RuntimeError(`Regular functions cannot be redeclared (as \`${name}\` is redeclared here).`);
                }
                return result;
            }

            /**
             * @syntax      [community <name> <parent> [begin ...<body>]]
             * @description Creates a community with the given name, parent and body
             */
            if (expr[0] === "community") {
                const [_community, name, parent, [_begin, ...body]] = expr,
                    parentEnv = this.eval(parent, env) || env, // if this.eval(community, env) === null, cannot access this.global properties => connect with current env
                    classEnv = new Environment({}, parentEnv);
                this.evalCommunityBody(body, classEnv);
                return env.define(name, classEnv);
            }

            /**
             * @syntax      [entity <community> ...<args>]
             * @description Reads a given property from a given object
             */
            if (expr[0] === "entity") {
                // REPAIR: See footnotes given inside this statement block
                let [_entity, community, args] = expr;
                const communityEnv = this.eval(community, env);
                const entityEnv = new Environment({}, communityEnv);
                if (args) args = args.map(param => this.eval(param, env));
                else args = [];
                this.call(communityEnv.get('constructor'), [entityEnv, ...args]); // CHANGE: REPAIR: entityEnv, given as explicit "this" argument to the constructor function, does not get used, nor implemented as its function tells us that should do
                return entityEnv;
            }

            /**
             * @syntax      [prop <entity> <property>]
             * @description Reads a given property from a given entity
             */
            if (expr[0] === "prop") {
                const [_prop, entity, property] = expr;
                const entityEnv = this.eval(entity, env);
                return entityEnv.get(property);
            }


            ////// TODO \\\\\\
            /*
                switch
                call stack
                line & column
                file reader
            */

            /**
             * @syntax      [if <condition> (<consequence> | [begin, ...<body>]) (<alternative> | [begin, ...<body>])*]
             * @description Executes one of the two branches given depending on the given condition's value of truth
             */
            if (expr[0] === "if") {
                const [_if, condition, consequence, alternative] = expr;
                let cond = this.eval(condition, env);
                if (this.type(cond) !== "logical") ErrorHandler.RuntimeError("Condition given to if statement cannot be computed into { true | false }")
                if (cond) {
                    if (!Array.isArray(consequence) || consequence[0] !== "begin")
                        return this.eval(consequence, env);

                    const [_begin, ...body] = consequence;
                    return this.evalMultiple(body, env);
                }
                if (typeof alternative !== "undefined") {
                    if (!Array.isArray(alternative) || alternative[0] !== "begin")
                        return this.eval(alternative, env);

                    const [_begin, ...body] = alternative;
                    return this.evalMultiple(body, env);
                }
                return null; // <=> this.eval('nothing', env);
            }
            {
                /** 
                 * @syntax      [while <condition> (<consequence> | [begin, ...<body>])]
                 * @description Executes one of the two branches given depending on the given condition's value of truth
                 */
                if (expr[0] === "while") {
                    const [_while, condition, consequence] = expr;
                    let lastExpr = null, cond;
                    // DEBATE: REPAIR: should while return false onerror?
                    while (this.type(cond = this.eval(condition, env)) === "logical" ? cond : (ErrorHandler.RuntimeError("Condition given to while statement cannot be computed into { true | false }"), false)) {
                        if (!Array.isArray(consequence) || consequence[0] !== "begin")
                            lastExpr = this.eval(consequence, env);

                        else {
                            const [_begin, ...body] = consequence;
                            lastExpr = this.evalMultiple(body, env);
                        }
                    }
                    // TODO: REPAIR: DEBATE: should (while && !smallWhile) expressions return any value? I don't think they should.
                    return lastExpr;
                }
            }
            {
                /** 
                 * @syntax      [for <initialization> <condition> <modification> (<consequence> | [begin, ...<body>])]
                 * @description Executes one of the two branches given depending on the given condition's value of truth
                 */
                if (expr[0] === "for") {
                    const [_for, initialization, condition, modification, consequence] = expr;
                    return this.eval(["begin", initialization, ["while", condition, ['begin', consequence, modification]]]);
                }
            }
            /** 
             * @ syntax      [and <first> <second>]
             * @ description Executes the AND logical operaion on two given expressions
             */
            //  if (expr[0] === "and") {
            //     const [_and, first, second] = expr;
            //     return this.eval(["begin", initialization, ["while", condition, ['begin', consequence, modification]]]);
            // }
            // should call method 'and (op1, op2) with (shortcircuit = true)'
            // should allow at overloading the change of shortcircuitry
            // if not, destroy any possibility to shortcircuit without nested ifs
            {
                /**
                 * @syntax [ <func> ...<args> ]
                 * @description Calls a built-in & globally-scoped function with given regular arguments 
                 */
                let [func, ...args] = expr;
                func = this.eval(func, env);
                if (typeof func === "function") {
                    args = args.map(arg => this.eval(arg, env))
                    return func(...args);
                }
            }
            /**
             * @syntax [ <name> { <regular>, <named> } ]
             * @description Calls a given user-defined function with given regular & named arguments
             */
            let [name, { regular = [], named = {} }] = expr;
            let content = this.eval(name, env);
            if (this.type(content) === "function") {
                if (this.isSpacedVar(name))
                    name = name.slice(1, -1);

                let func = { name, ...content };
                regular = regular.map(arg => this.eval(arg, env));

                // modify all `...` keys into ... before starting
                Object.entries(named).forEach(([key, value]) => { named[key] = this.eval(value, env); });
                console.log(func, { regular, named })
                return this.call(func, { regular, named });
            }
            ErrorHandler.RuntimeError(`The variable \`${name}\` does not represent a function, therefore, it cannot be called.`)
        }

        if (this.isNum(expr)) return expr;
        if (this.isStr(expr)) return expr.slice(1, -1);
        if (this.isOp(expr)) return env.get(expr);
        if (this.isVar(expr)) return env.get(expr);
        if (this.isSpacedVar(expr)) return env.get(expr.slice(1, -1));

        ErrorHandler.RuntimeError(`The token "${expr}" has no functionality associated with it.`)
    }
    evalFuncBody(body, env) {
        let lastExpr = null;
        body.forEach(expr => {
            if (Array.isArray(expr) && ['community', 'begin'].includes(expr[0]))
                ErrorHandler.RuntimeError(`Expected { literal | var | assign | func | entity | prop | method_call } expression - Found ${expr[0]}`);

            lastExpr = this.eval(expr, env);
        })
        return lastExpr;
    }
    evalCommunityBody(body, env) {
        let lastExpr = null;
        body.forEach(expr => {
            if (!Array.isArray(expr) || !['var', 'func'].includes(expr[0]))
                ErrorHandler.RuntimeError(`Expected { var | func } expression - Found ${Array.isArray(expr) ? expr[0] : expr}`);

            lastExpr = this.eval(expr, env);
        })
        return lastExpr;
    }
    evalMultiple(body, env) {
        let lastExpr = null;
        body.forEach(expr => {
            lastExpr = this.eval(expr, env);
        })
        return lastExpr;
    }
    call(func, args) {
        let activationRecord = {}, paramNames, undefinedArgs;
        // DEBATE: too few regular arguments error should / should not exist (arguments for 'should not': overloading in JS is only possible using parameter number, named arguments would differ when using different overloaded functions, which creates confusion)

        // if (args.regular.length < func.params.regular.length)
        //     ErrorHandler.RuntimeError(`Too few regular arguments given when calling the function '${func.name}'.`);

        if (args.regular.length > func.params.regular.length)
            ErrorHandler.RuntimeError(`Too many regular arguments given when calling the function '${func.name}'.`);

        paramNames = func.params.named.map(param => param.name);
        undefinedArgs = Object.keys(args.named).filter(key => !paramNames.includes(key));

        if (undefinedArgs.length === 1)
            ErrorHandler.RuntimeError(`The named argument '${undefinedArgs[0]}' is not declared as a named parameter inside the function '${func.name}'.`)

        if (undefinedArgs.length > 1)
            ErrorHandler.RuntimeError(`The named arguments '${undefinedArgs.join(', ')}' are not declared as named parameters inside the function '${func.name}'.`)

        func.params.regular.forEach((param, index) => { activationRecord[param.name] = args.regular[index] === undefined ? param.value : args.regular[index] }); // param.value = the default value of the parameter
        func.params.named.forEach(param => { activationRecord[param.name] = args.named[param.name] === undefined ? param.value : args.named[param.name] });

        const activationEnv = new Environment(activationRecord, func.env);
        return this.evalFuncBody(func.body, activationEnv);
    }
}