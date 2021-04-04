class Generator {
    constructor() {
        this.global = new Environment({
            'nothing': null,
            'true': true,
            'false': false,
            'print': (...args) => { // rest operator
                if(!args.length) console.warn("no_args :(");
                console.warn(...args);
                return 'nothing'; //args.join(' ');
            },
            'next': (arg) => {
                return arg + 1;
            },
            'error': message => {
                ErrorHandler.Error(message);
            },

            // pt toti operatorii se face o verificare explicita in blocul functiei lor cu privire la operandul (1 si/sau 2) este boolean, interzice calculul daca nu face sens logic, ci numai printr-o conversie (fara conversii aici)

            '+': (op1, op2 = undefined) => op2 ? op1 + op2 : +op1, // <== FIXME: none of them should be allowed to be null, if op1 sau op2 == boolean expressions (true sau false), throw error (cannot { unary plus | addition } to a logical value)
            '-': (op1, op2 = undefined) => op2 ? op1 - op2 : -op1, // if op1 sau op2 == boolean expressions (true sau false), throw error (cannot { unary minus | subtraction } to a a logical value)
            '*': (op1, op2) => op1 * op2,  // de facut cazul op1.type === string si op2.type = number (multiplicarea stringului)
            '/': (op1, op2) => {
                if (op2 == 0) ErrorHandler.RuntimeError(`Division with second operand equal to 0.`);
                return op1 / op2;
            },
            '<': (op1, op2) => op1 < op2, // if op1 sau op2 == boolean expressions (true sau false), throw error (cannot compare number with logical value)
            '<=': (op1, op2) => op1 <= op2, // la fel si aici
            '>': (op1, op2) => op1 > op2,  // la fel si aici
            '>=': (op1, op2) => op1 >= op2,  // la fel si aici
            'is': (op1, op2) => { 
                if(typeof op1 === "boolean") // we stop type coercion of boolean to number. Instead, we do number to boolean
                    return op1 === (op2 !== false);

                if(typeof op2 === "boolean") 
                    return (op1 !== false) === op2;

                return op1 === op2;
            },
            'is not': (op1, op2) => {
                if(typeof op1 === "boolean") // we stop type coercion of boolean to number. Instead, we do number to boolean
                    return op1 !== (op2 !== false);

                if(typeof op2 === "boolean") 
                    return (op1 !== false) !== op2;

                return op1 !== op2;
            },
            'and': (op1, op2) => op1 !== false && op2 !== false,
            'or': (op1, op2) => op1 !== false || op2 !== false,
            'not': op1 => !(op1 !== false),
        });
    }

    isNum(expr) {
        return typeof expr === "number";
    }
    isStr(expr) {
        return typeof expr === "string" && /^".*"$/.test(expr);
    }
    isOp(expr) {
        return typeof expr === "string" && /^\+|\-|\*|\/|\>|\<|\>\=|\<\=|is|is not|and|or|not$/.test(expr); // isnt instead or is not
    }
    isVar(expr) {
        return typeof expr === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(expr);
    }

    eval(expr, env = this.global) {
        if (Array.isArray(expr)) {

            /**
             * @syntax      [var <name> <value?>]
             * @description Creates a variable with the given name and value
             */
            if (expr[0] === "var") {
                let [_var, name, value] = expr;
                if (typeof value === undefined) return env.define(name, null); // env.define(name, this.eval('null', env))
                return env.define(name, this.eval(value, env)); // rethink Attribute concept (not common to all instances)
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
                    return entityEnv.define(property, this.eval(value, env)); // will do exactly the same for the cases where the "assign()" method would have been needed
                } else {
                    const [_assign, name, value] = expr;
                    return env.assign(name, this.eval(value, env));
                }
            }

            /**
             * @syntax      [begin <...body>]
             * @description Evaluates a code block
             */
            if (expr[0] === "begin") {
                const [_begin, ...body] = expr;
                return this.evalMultiple(body, env);
            }

            /**
             * @syntax      [arrow <args> (<instruction> | [begin <...body>])]
             * @description Creates an anonymous function with the given arguments and body
             */
            if (expr[0] === "arrow") {
                const [_arrow, args, instruction] = expr;
                if (Array.isArray(instruction) && instruction[0] === "begin") {
                    const [_begin, ...body] = instruction;
                    return { args, body, env };
                }
                return { args, body: [instruction], env }
            }

            /**
             * @syntax      [func <name> <args> (<instruction> | [begin <...body>])]
             * @description Creates a function with the given name, arguments and body
             */
            if (expr[0] === "func") {
                const [_func, name, args, instruction] = expr;
                return env.define(name, this.eval(["arrow", args, instruction]));
            }

            /**
             * @syntax      [community <name> <parent> [begin <...body>]]
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
             * @syntax      [entity <community> <...params>]
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
             * @syntax      [if <condition> (<consequence> | [begin, <...body>]) (<alternative> | [begin, <...body>])*]
             * @description Executes one of the two branches given depending on the given condition's value of truth
             */
            if (expr[0] === "if") {
                const [_if, condition, consequence, alternative] = expr;
                let cond = this.eval(condition, env);
                if (cond !== false) { // correct output for falsy values in if condition (will be treated as truthy if different of false, Nothing could also be considered falsy, debate later Nothing and other values)
                    if (!Array.isArray(consequence) || consequence[0] !== "begin")
                        return this.eval(consequence, env);

                    const [_begin, ...body] = consequence;
                    return this.evalMultiple(body, env);
                }
                if (typeof alternative !== undefined) {
                    if (!Array.isArray(alternative) || alternative[0] !== "begin")
                        return this.eval(alternative, env);

                    const [_begin, ...body] = alternative;
                    return this.evalMultiple(body, env);
                }
                return null; // <=> this.eval('null', env);
            }

            /** 
             * @syntax      [while <condition> (<consequence> | [begin, <...body>])]
             * @description Executes one of the two branches given depending on the given condition's value of truth
             */
            if (expr[0] === "while") {
                const [_while, condition, consequence] = expr;
                let lastExpr = null;
                while (this.eval(condition, env)) {
                    if (!Array.isArray(consequence) || consequence[0] !== "begin")
                        lastExpr = this.eval(consequence, env);

                    else {
                        const [_begin, ...body] = consequence;
                        lastExpr = this.evalMultiple(body, env);
                    }
                }
                return lastExpr;
            }

            /** 
             * @syntax      [for <initialization>? <condition> <modification> (<consequence> | [begin, <...body>])]
             * @description Executes one of the two branches given depending on the given condition's value of truth
             */
            if (expr[0] === "for") {
                const [_for, initialization, condition, modification, consequence] = expr;
                return this.eval(["begin", initialization, ["while", condition, ['begin', consequence, modification]]]);
            }

            /**
             * @syntax [<func> <...params>]
             * @description Calls a given function with given parameters
             */
            let [func, ...params] = expr;

            func = this.eval(func, env);
            params = params.map(param => this.eval(param, env));

            /* Built-in functions, all globally-scoped */
            if (typeof func === "function") return func(...params);

            /* User-defined functions */
            return this.call(func, params);
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
    call(func, params) {
        let activationRecord = {};
        func.args.forEach((arg, index) => { activationRecord[arg] = params[index] });
        const activationEnv = new Environment(activationRecord, func.env);
        return this.evalFuncBody(func.body, activationEnv);
    }
}