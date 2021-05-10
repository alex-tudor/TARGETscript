// operatorii "AND" si "OR" NU sunt scurtcircuitati in Target
// change typeofs into custom type() function (because expressions could be identifiers / function calls)
// create ErrorStmt and PrintStmt

class Generator {
    constructor() {
        this.global = new Environment({
            'nothing': null,
            'true': true,
            'false': false,
            // 'print': (...args) => (args.length && console.log(args.join(' ')), 'nothing'),
            'print': (...args) => (args.length && console.log(args.map(arg => (arg === null && 'nothing') || (arg === true && 'true') || (arg === false && 'false') || arg).join(' ')), 'nothing'),
            'error': message => (typeof message === "undefined" ? ErrorHandler.Error('An error occured.') : ErrorHandler.Error((message === null && 'nothing') || (message === true && 'true') || (message === false && 'false') || message), 'nothing'),
            'and': (first, second) => {
                if (typeof first === "boolean" && typeof second === "boolean") return first && second;
                ErrorHandler.RuntimeError("Bad operand types for the 'and' operator.");
            },
            'or': (first, second) => {
                if (typeof first === "boolean" && typeof second === "boolean") return first || second;

            },
            'is': (first, second) => {
                if (typeof first === "boolean" && typeof second === "boolean") return first === second; // we stop type coercion of boolean to number. Instead, we do number to boolean
                if (typeof first === "number" && typeof second === "number") return first === second;
                // TODO: add comparation between strings using a custom type() function
                ErrorHandler.RuntimeError("Bad operand types for the 'is' operator.");
            },
            'is not': (first, second) => {
                const validTypes = [
                    ['logical', 'logical'],
                    ['numeric', 'numeric'],
                    ['logical', 'nothing'],
                    ['nothing', 'logical'],
                    ['text', 'nothing'],
                    ['nothing', 'text']
                ];
                if (validTypes.some(arr => arr[0] === this.type(first) && arr[1] === this.type(second)))
                    return first !== second;

                ErrorHandler.RuntimeError(`Bad operand types for the 'is not' operator: ${first}, ${second}`);
            },
            '<': (op1, op2) => {
                if (typeof first === "number" && typeof second === "number") return op1 < op2; // if op1 sau op2 == boolean expressions (true sau false), throw error (cannot compare number with logical value)
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
                if (op2 == 0) ErrorHandler.RuntimeError(`Division with second operand equal to 0.`);
                return op1 / op2;
            },
            'unary +': operand => {
                if (typeof operand === "number") return operand;
                // TODO: add comparation between strings using a custom type() function
                ErrorHandler.RuntimeError("Bad operand type for the 'unary +' operator.");
            }, // if op1 sau op2 == boolean expressions (true sau false), throw error (cannot { unary minus | subtraction } to a a logical value)
            'unary -': operand => {
                if (typeof operand === "number") return -operand;
                // TODO: add comparation between strings using a custom type() function
                ErrorHandler.RuntimeError("Bad operand type for the 'unary -' operator.");
            }, // if op1 sau op2 == boolean expressions (true sau false), throw error (cannot { unary minus | subtraction } to a a logical value)
            'not': op1 => !(op1 !== false), // be sure op1 is a boolean, bcz it might be nothing or object / list (verify with !== on true and false)
        });
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
    type(expr) {
        if (expr === null) return "nothing";
        if (expr === true || expr === false) return "logical";
        if (typeof expr === "number") return "numeric";
        if (typeof expr === "string") return "text";
        /* CHANGE, REPAIR */ return 'other';
    }

    generate(input) {
        if(typeof input !== "object" || input.constructor.name !== "Array")
            ErrorHandler.InternalError("Input given to the Generator is not of type 'array'.");

        return this.eval(input);
    }

    eval(expr, env = this.global) {
        if (Array.isArray(expr)) {

            /**
             * @syntax      [var ...<variables>]
             * @description Creates one or more variables with the given names and values
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

            // /**
            //  * @syntax      [type <expression>]
            //  * @description Returns the type of a given expression
            //  */
            if (expr[0] === "type") {
                let [_type, expression] = expr;
                expression = this.eval(expression, env);
                console.log(expr, expression);
                return this.type(expression);
            }

            /**
             * @syntax      [assign <name> <value>]
             * @syntax      [assign [prop <entity> <property>] <value>]
             * @description Assigns the given value to the given variable / property of an entity
             */
            if (expr[0] === "assign") {
                if (Array.isArray(expr[1]) && expr[1][0] === "prop") {
                    const [_assign, [_prop, entity, property], value] = expr,
                        entityEnv = this.eval(entity, env);

                    // should the below instruction be only entityEnv.assign ?
                    return entityEnv.define(property, this.eval(value, env)); // will do exactly the same for the cases where the "assign()" method would have been needed
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
             * @syntax      [arrow <unnamed> <named> (<statement> | [begin ...<body>])]
             * @description Creates an anonymous function with the given unnamed parameters, named parameters and body
             * TODO: make arrows to be like functions, but without name
             */
            if (expr[0] === "arrow") {
                       // check for disjunction between params.named & params.unnamed
        // ex. func say(message, :greeting, message, :message, :welcome):

                const [_arrow, unnamed, named, statement] = expr;
                if (Array.isArray(statement) && statement[0] === "begin") {
                    const [_begin, ...body] = statement;
                    return {
                        params: { unnamed, named },
                        body: body,
                        env
                    };
                }
                return {
                    params: { unnamed, named },
                    body: [statement],
                    env
                };
            }

            /**
             * @syntax      [func <name> <unnamed> <named> (<statement> | [begin ...<body>])]
             * @description Creates a function with the given name, unnamed parameters, named parameters and body
             */
            if (expr[0] === "func") {
                const [_func, name, unnamed, named, statement] = expr;
                return env.define(name, this.eval(["arrow", unnamed, named, statement]));
            }

            /**
             * @syntax      [community <name> <parent> [begin ...<body>]]
             * @description Creates a community with the given name, parent and body
             */
            if (expr[0] === "community") {
                const [_community, name, parent, [_begin, ...body]] = expr,
                    parentEnv = this.eval(parent, env) || env, // if this.eval(community, env) == null, cannot access this.global properties => connect with current env
                    classEnv = new Environment({}, parentEnv);
                this.evalCommunityBody(body, classEnv);
                return env.define(name, classEnv);
            }

            /**
             * @syntax      [entity <community> ...<params>]
             * @description Reads a given property from a given object
             */
            if (expr[0] === "entity") {
                let [_entity, community, params] = expr;
                const communityEnv = this.eval(community, env);
                const entityEnv = new Environment({}, communityEnv);
                if (params) params = params.map(param => this.eval(param, env));
                else params = [];
                this.call(communityEnv.get('constructor'), [entityEnv, ...params]);
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
                if (cond !== true && cond !== false) ErrorHandler.RuntimeError("Condition given to if statement cannot be computed into { true | false }")
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

            /** 
             * @syntax      [while <condition> (<consequence> | [begin, ...<body>])]
             * @description Executes one of the two branches given depending on the given condition's value of truth
             */
            if (expr[0] === "while") {
                const [_while, condition, consequence] = expr;
                let lastExpr = null, cond;
                while ((cond = this.eval(condition, env)) === true ? true : (cond === false ? false : (ErrorHandler.RuntimeError("Condition given to while statement cannot be computed into { true | false }"), false))) {
                    if (!Array.isArray(consequence) || consequence[0] !== "begin")
                        lastExpr = this.eval(consequence, env);

                    else {
                        const [_begin, ...body] = consequence;
                        lastExpr = this.evalMultiple(body, env);
                    }
                }
                return lastExpr;
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
                 * @description Calls a built-in & globally-scoped function with given unnamed arguments 
                 */
                let [func, ...args] = expr;
                func = this.eval(func, env);
                if (typeof func === "function") {
                    args = args.map(arg => this.eval(arg, env))
                    return func(...args);
                }
            }
            {
                /**
                 * @syntax [ <name> { <unnamed>, <named> } ]
                 * @description Calls a given user-defined function with given unnamed & named arguments
                 */
                let [name, { unnamed = [], named = {} }] = expr;
                let func = { name, ...this.eval(name, env) };
                unnamed = unnamed.map(arg => this.eval(arg, env));
                Object.entries(named).map(([key, value]) => {
                    named[key] = this.eval(value, env);
                });
                console.log(func, { unnamed, named })
                return this.call(func, { unnamed, named });
            }
        }

        if (this.isNum(expr)) return expr;
        if (this.isStr(expr)) return expr.slice(1, -1);
        if (this.isOp(expr)) return env.get(expr);
        if (this.isVar(expr)) return env.get(expr);

        ErrorHandler.SyntaxError(`The token "${expr}" has no functionality associated with it.`)
    }
    evalFuncBody(body, env) {
        let lastExpr = null;
        body.forEach(expr => {
            if (Array.isArray(expr) && ['community', 'begin'].includes(expr[0]))
                ErrorHandler.SyntaxError(`Expected { literal | var | assign | func | entity | prop | method_call } expression - Found ${expr[0]}`);

            lastExpr = this.eval(expr, env);
        })
        return lastExpr;
    }
    evalCommunityBody(body, env) {
        let lastExpr = null;
        body.forEach(expr => {
            if (!Array.isArray(expr) || !['var', 'func'].includes(expr[0]))
                ErrorHandler.SyntaxError(`Expected { var | func } expression - Found ${Array.isArray(expr) ? expr[0] : expr}`);

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
        // DEBATE: too few unnamed arguments error should / should not exist (arguments for 'should not': overloading in JS is only possible using parameter number, named arguments would differ when using different overloaded functions, which creates confusion)

        // if (args.unnamed.length < func.params.unnamed.length)
        //     ErrorHandler.RuntimeError(`Too few unnamed arguments given when calling the function '${func.name}'.`);

        if (args.unnamed.length > func.params.unnamed.length)
            ErrorHandler.RuntimeError(`Too many unnamed arguments given when calling the function '${func.name}'.`);

        paramNames = func.params.named.map(param => param.name);
        undefinedArgs = Object.keys(args.named).filter(key => !paramNames.includes(key));

        if (undefinedArgs.length === 1)
            ErrorHandler.RuntimeError(`The named argument '${undefinedArgs[0]}' is not declared as a named parameter inside the function '${func.name}'.`)

        if (undefinedArgs.length > 1)
            ErrorHandler.RuntimeError(`The named arguments '${undefinedArgs.toString().split(',').join(', ')}' are not declared as named parameters inside the function '${func.name}'.`)

        // check for duplicate name of named argument appearing in call:
        // ex. say("Hi", welcome = true, greeting = false, welcome = false) 

        func.params.unnamed.forEach((param, index) => { activationRecord[param.name] = args.unnamed[index] ?? param.value }); // param.value = the default value of the parameter
        func.params.named.forEach(param => { activationRecord[param.name] = args.named[param.name] ?? param.value });

        const activationEnv = new Environment(activationRecord, func.env);
        return this.evalFuncBody(func.body, activationEnv);
    }
}