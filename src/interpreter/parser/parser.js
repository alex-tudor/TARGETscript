// Establish if code from here is going in accord to the EBNF file
// TODO: la TOATE expresiile, verifica astfel incat firstOperand sa se 'verifice' O SINGURA DATA si NU DE TREI ORI (este ok in cazul lui LogicalExpr, poti lua de acolo modelul de implementare pt celelalte functii)

// according to rebuilding of Terminal(value, kind) func, it may be possible to write everywhere in this parser at the end of funcs: return false, instead of return null, check if it is all ok and if it is, then do it

// DEBATE: the syntax 'var a = b = c = ... = z = 42' is not valid if 'b, c ... z' are not declared before (the reason: you cannot know if b, c  ... z were declared or not before, so, should you declare them or not? should you verify this at runtime so or just throw error because it is considered bad syntax)
// use as alternative to this:
//     var a, b, c ... z
//     a = b = c = ... = z = 42

// for number from A to B where condition:
//                        with
//                        when

/*
    // de facut bucla for,
    // for-each (for each element of array),
    // for ca varianta extinsa de foreach, pt numar si array de numere generat la runtime prin sintaxa nr1...nr2
    //      > (for number in nr1...nr2)
    //      > (for number from nr1 to nr2)
    //      unde nr1...nr2 va contine numerele din intervalul inchis [nr1, nr2]


    // de facut:
        1 < y < 2 < giveThree()
        si
        4 > 3 > 2 > 1

        ar trebui sa avem si modelul urmator?
        5 < 7 > 19 < y + 2

    DEBATE: mai foloseste Error Handling-ul realizat mai jos?
    Terminal(value, kind) {
        /**
         * @param {String} value - the actual content of the terminal
         * @param {String} kind  - the kind of the terminal, according to Target rules
         * /
        if (value === undefined || kind === undefined) ErrorHandler.InternalError('Please revise your syntax regarding Terminal(value, kind)');
        let saved = this.cursor;

        if (this.input[this.cursor]?.value === value && this.input[this.cursor]?.kind === kind) {
            this.cursor++;
            return value; // to be checked <= if it may need value || true (strongly believe it deos not need)
        }

        this.restore(saved);

        return false;
    }
    */
   
import ErrorHandler from '../error-handler/error-handler.js';

export default class Parser {
    constructor() {}
    
    parse(input) {
        if (typeof input !== "object" || input.constructor.name !== "Array")
            ErrorHandler.InternalError("Input given to the Parser is not of type 'array'.");

        this.input = input;
        this.cursor = 0;
        this.savedCursor = this.cursor;
        this.output = this.Program();
        if (this.cursor > this.input.length) ErrorHandler.SyntaxError(`Unexpected end of input`);
        else if (this.cursor < this.input.length) {
            console.warn(this.output);
            ErrorHandler.SyntaxError(`(${this.input[this.cursor].line} : ${this.input[this.cursor].column}) - Unknown token "${this.input[this.cursor].value}"`);
        }
        console.log(`output: ${JSON.stringify(this.output, null, 4)}`, this.output, `, cursor: ${this.cursor}, input.length: ${this.input.length}`);
        return this.output; /* ['begin', 'nothing']; */
    }

    verify(value) {
        return value !== null;
    }

    restore(initial) {
        this.cursor = initial;
    }

    isSpacedIdentifier(identifier) {
        return /^(?:`[A-Za-z0-9_ ]+`)$/.test(identifier);
    }

    Program() {
        let initial = this.cursor, list;
        return this.verify(list = this.StatementList()) ? list : (this.restore(initial), ['begin', 'nothing']); // program that does nothing, valid in Target for the moment (represents support for empty / description-using-comments files)
    }

    StatementList() {
        let initial = this.cursor, list = ['begin'], statement;
        if (this.verify(statement = this.Statement())) {
            list.push(statement);
            while (this.verify(statement = this.Statement())) {
                list.push(statement);
            }
            return list;
        }
        return this.restore(initial), null;
    }

    Statement() {
        let initial = this.cursor, expression;
        return this.verify(expression = this.PrintStatement())
            || (this.restore(initial), this.verify(expression = this.ErrorStatement()))
            || (this.restore(initial), this.verify(expression = this.UseStatement()))
            || (this.restore(initial), this.verify(expression = this.ExportStatement()))
            || (this.restore(initial), this.verify(expression = this.ConstantDeclaration()))
            || (this.restore(initial), this.verify(expression = this.VariableDeclaration()))
            || (this.restore(initial), this.verify(expression = this.FunctionDeclaration()))
            || (this.restore(initial), this.verify(expression = this.IfStatement()))
            || (this.restore(initial), this.verify(expression = this.WhileStatement()))
            || (this.restore(initial), this.verify(expression = this.Expression()) && this.Terminal('', 'EOL'))
            ? expression
            : (this.restore(initial), null);
    }

    PrintStatement() {
        let initial = this.cursor, list = [], sequence;
        if (this.Terminal('print', 'reserved') &&
            this.verify(sequence = this.Expression())) {
            list.push(sequence);
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.Expression())) {
                    list.push(sequence);
                } else {
                    this.restore(initial);
                    return null;
                }
            }
            if (this.Terminal("", "EOL")) {
                return ['print', ...list];
            }
        }
        this.restore(initial);
        return null;
    }

    ErrorStatement() {
        let initial = this.cursor;
        let message;
        if (this.Terminal('error', 'reserved')) {
            let save2 = this.cursor;
            if (this.verify(message = this.Expression()) && this.Terminal("", "EOL")) {
                return ['error', message];
            }
            this.restore(save2);
            if (this.Terminal("", "EOL")) {
                return ['error'];
            }
        }
        this.restore(initial);
        return null;
    }

    // TODO: schimba numele variabilelor accordingly in import si export (ImportStmt in UseStmt aici si in ebnf)

    UseStatement() {
        let initial = this.cursor, list = [], component, filename;
        if (this.Terminal('use', 'reserved') &&
            this.verify(component = this.Identifier())) {
            list.push(component);
            while (this.Terminal(',', 'operator')) {
                if (this.verify(component = this.Identifier())) {
                    list.push(component);
                } else {
                    this.restore(initial);
                    return null;
                }
            }
            if (this.Terminal("from", "reserved")
                && this.verify(filename = this.StringLiteral())
                && this.Terminal("", "EOL")) {
                return ['use', filename, ...list];
            }
        }
        this.restore(initial);
        return null;
    }


    ExportStatement() {
        let initial = this.cursor, list = [], sequence;
        if (this.Terminal('export', 'reserved') &&
            this.verify(sequence = this.Identifier())) {
            list.push(sequence);
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.Identifier())) {
                    list.push(sequence);
                } else {
                    this.restore(initial);
                    return null;
                }
            }
            if (this.Terminal("", "EOL")) {
                return ['export', ...list];
            }
        }
        this.restore(initial);
        return null;
    }

    ConstantDeclaration() {
        let initial = this.cursor, list;
        return this.Terminal('const', 'reserved')
            && this.verify(list = this.ConstantSequenceList())
            && this.Terminal("", "EOL")
            ? ['const', ...list]
            : (this.restore(initial), null);
    }

    ConstantSequenceList() {
        let initial = this.cursor, list = [], sequence;
        if (this.verify(sequence = this.ConstantSequence())) {
            list.push(sequence);
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.ConstantSequence())) {
                    list.push(sequence);
                } else {
                    this.restore(initial);
                    return null;
                }
            }
            return list;
        }
        this.restore(initial);
        return null;
    }

    ConstantSequence() {
        let initial = this.cursor, name, value;
        if (this.verify(name = this.Identifier())) {
            if (this.isSpacedIdentifier(name))
                name = name.slice(1, -1);

            if (this.Terminal('=', 'operator')
                && this.verify(value = this.Expression())) {
                return [name, value];
            }
        }
        return this.restore(initial), null;
    }

    VariableDeclaration() {
        let initial = this.cursor, list;
        return this.Terminal('var', 'reserved')
            && this.verify(list = this.VariableSequenceList())
            && this.Terminal("", "EOL")
            ? ['var', ...list]
            : (this.restore(initial), null);
    }

    VariableSequenceList() {
        let initial = this.cursor, list = [], sequence;
        if (this.verify(sequence = this.VariableSequence())) {
            list.push(sequence);
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.VariableSequence())) {
                    list.push(sequence);
                } else {
                    this.restore(initial);
                    return null;
                }
            }
            return list;
        }
        this.restore(initial);
        return null;
    }

    VariableSequence() {
        let initial_1 = this.cursor, name, value;
        if (this.verify(name = this.Identifier())) {
            if (this.isSpacedIdentifier(name))
                name = name.slice(1, -1);

            let initial_2 = this.cursor;
            if (this.Terminal('=', 'operator')
                && this.verify(value = this.Expression())) {
                return [name, value];
            }
            this.restore(initial_2);
            return [name, 'nothing'];
        }
        return this.restore(initial_1), null;
    }

    FunctionDeclaration() {
        let initial = this.cursor, name, params, body;
        if (this.Terminal('func', 'reserved')
            && this.verify(name = this.Identifier())) {
            if (this.isSpacedIdentifier(name))
                name = name.slice(1, -1);

            if (this.Terminal('(', 'operator')
                && this.verify(params = this.ParameterSequenceList())
                && this.Terminal(')', 'operator')
                && this.Terminal(':', 'punctuator')
                && this.Terminal("", "EOL")
                && this.Terminal("", "INDENT")
                && this.verify(body = this.StatementList())
                && this.Terminal("", "DEDENT")
            )
                return ['func', name, params.regular, params.named, body];
        }
        this.restore(initial);
        return null;
    }

    ParameterSequenceList() {
        let initial = this.cursor, list = { regular: [], named: [] }, sequence, identifier;
        if (this.verify(sequence = this.ParameterSequence())) {
            list[sequence.type].push({ name: sequence.name, value: sequence.value });
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.ParameterSequence())) {
                    list[sequence.type].push({ name: sequence.name, value: sequence.value });
                } else {
                    this.restore(initial);
                    return null;
                }
            }
        } else {
            this.restore(initial);
        }

        // func `example function`(a, b, c, d, d, d):
        //     <code>
        if ((identifier = list.regular.map(sequence => sequence.name).find((item, index) => list.regular.map(sequence => sequence.name).lastIndexOf(item) !== index)) !== undefined)
            ErrorHandler.SyntaxError(`You are not allowed to use duplicate regular parameter names (as '${identifier}' is used here) inside a function declaration.`);

        // func `example function`(:a, :b, :c, :d, :d, :d):
        //     <code>
        if ((identifier = list.named.map(sequence => sequence.name).find((item, index) => list.named.map(sequence => sequence.name).lastIndexOf(item) !== index)) !== undefined)
            ErrorHandler.SyntaxError(`You are not allowed to use duplicate named parameter names (as '${identifier}' is used here) inside a function declaration.`);

        // func `example function`(a, b, c, :a, :b, :c):
        //     <code>
        if ((identifier = list.regular.map(sequence => sequence.name).find(item => ~list.named.map(sequence => sequence.name).indexOf(item))) !== undefined)
            ErrorHandler.SyntaxError(`You are not allowed to use the same identifier for a named and a regular parameter (as '${identifier}' is used here) inside a function declaration.`)

        return list;
    }

    ParameterSequence() {
        let type = "regular", name, value, initial_1 = this.cursor;
        if (this.Terminal(':', 'punctuator')) {
            type = "named";
        }
        if (this.verify(name = this.Identifier())) {
            if (this.isSpacedIdentifier(name))
                name = name.slice(1, -1);

            let initial_2 = this.cursor;
            if (this.Terminal('=', 'operator') &&
                this.verify(value = this.Expression())) {
                return { type, name, value };
            }
            this.restore(initial_2);
            return { type, name, value: "nothing" };
        }
        return this.restore(initial_1), null;
    }

    IfStatement() {
        let initial_1 = this.cursor, condition, consequence, alternative;

        if (this.Terminal('if', 'reserved') &&
            this.verify(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.verify(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT')) {
            let initial_2 = this.cursor;
            if (this.Terminal('else', 'reserved')) {
                let initial_3 = this.cursor;
                if (this.Terminal(':', 'punctuator') &&
                    this.Terminal('', 'EOL') &&
                    this.Terminal('', 'INDENT') &&
                    this.verify(alternative = this.StatementList()) &&
                    this.Terminal('', 'DEDENT'))
                    return ['if', condition, consequence, alternative]
                this.restore(initial_3);
                if (this.verify(alternative = this.IfStatement())) {
                    return ['if', condition, consequence, alternative];
                }
                this.restore(initial_3);
                if (this.verify(alternative = this.WhileStatement())) {
                    return ['if', condition, consequence, alternative];
                }
                this.restore(initial_2);
            }
            return ['if', condition, consequence]
        }
        return this.restore(initial_1), null;
    }

    WhileStatement() {
        let initial = this.cursor, condition, consequence;
        return this.Terminal('while', 'reserved')
            && this.verify(condition = this.LogicalExpression())
            && this.Terminal(':', 'punctuator')
            && this.Terminal('', 'EOL')
            && this.Terminal('', 'INDENT')
            && this.verify(consequence = this.StatementList())
            && this.Terminal('', 'DEDENT')
            ? ['while', condition, consequence]
            : (this.restore(initial), null);
    }

    Expression() {
        let initial = this.cursor, expression;
        return (this.verify(expression = this.VariableAssignment()) || (this.restore(initial), this.verify(expression = this.LogicalExpression()))) ? expression : (this.restore(initial), null);
    }

    VariableAssignment() {
        let initial = this.cursor;
        let name, value;

        if (this.verify(name = this.Identifier())) {
            if (this.isSpacedIdentifier(name))
                name = name.slice(1, -1);

            if (this.Terminal('=', 'operator') &&
                this.verify(value = this.Expression()))
                return ['assign', name, value];
        }
        return this.restore(initial), null;
    }

    // DEBATE: should there be and- and or-expressions on different levels or precedence (and.prec > or.prec) or to be let on same levels with crossing over operations from right to left
    // now, they are on the same level of precedence
    // ALREADY_IMPLEMENTED: denial of using and- and or-expressions next to each other without parantheses:
    //  ex.  E1 and  E2  or E3  => not OK
    //      (E1 and  E2) or E3  => OK
    //       E1 and (E2  or E3) => OK
    //       E1 and  E2  and  E3  or  E4  and E5  and E6   => not OK
    //     ((E1 and  E2  and  E3) or  E4) and E5  and E6   => OK
    //       E1 and  E2  and (E3  or (E4  and E5  and E6)) => OK
    //      (E1 and  E2  and  E3) or (E4  and E5  and E6)  => OK

    // TO BE OPTIMIZED IN THE FUTURE IF NEEDED
    LogicalExpression() {
        let initial_1 = this.cursor, first, second;
        if (this.verify(first = this.EqualityExpression())) {
            let initial_2 = this.cursor;
            if (this.Terminal('and', 'operator') &&
                this.verify(second = this.AndExpression())) {
                return ['and', first, second];
            }
            this.restore(initial_2);
            if (this.Terminal('or', 'operator') &&
                this.verify(second = this.OrExpression())) {
                return ['or', first, second];
            }
            return this.restore(initial_2), first;
        }
        return this.restore(initial_1), null;
    }

    AndExpression() {
        let initial_1 = this.cursor, first, second;
        if (this.verify(first = this.EqualityExpression())) {
            let initial_2 = this.cursor;
            if (this.Terminal('and', 'operator') &&
                this.verify(second = this.AndExpression()))
                return ['and', first, second];
            return this.restore(initial_2), first;
        }
        return this.restore(initial_1), null;
    }

    OrExpression() {
        let initial_1 = this.cursor, first, second;
        if (this.verify(first = this.EqualityExpression())) {
            let initial_2 = this.cursor;
            if (this.Terminal('or', 'operator') &&
                this.verify(second = this.OrExpression()))
                return ['or', first, second];
            return this.restore(initial_2), first;
        }
        return this.restore(initial_1), null;
    }

    // remember: a !== b is not <=> with a === !b
    // conteaza ca instructiunea cu clauza "is not" sa fie individual calculata inaintea instructiunii cu clauza pentru "is"
    EqualityExpression() {
        let initial_1 = this.cursor, first, second;
        if (this.verify(first = this.RelationalExpression())) {
            let initial_2 = this.cursor;
            if (this.Terminal('is', 'operator')) {
                let operator = 'is';
                if (this.Terminal('not', 'operator'))
                    operator = 'is not';

                if (this.verify(second = this.RelationalExpression()))
                    return [operator, first, second];

                this.restore(initial_2);
            }
            return first;
        }
        return this.restore(initial_1), null;
    }

    RelationalExpression() {
        let initial_1 = this.cursor, first, second;
        if (this.verify(first = this.AdditiveExpression())) {
            let initial_2 = this.cursor;
            let lookaheadOperator = this.input[this.cursor]?.value;
            if (this.input[this.cursor]?.type === "operator" && ['<', '>', '<=', '>='].includes(lookaheadOperator)) {
                this.cursor++; // skip actual sign
                if (this.verify(second = this.AdditiveExpression()))
                    return [lookaheadOperator, first, second];
            }
            return this.restore(initial_2), first;
        }
        return this.restore(initial_1), null;
    }

    // LogicalPrimaryExpression() {
    //     let saved = this.cursor;
    //     let expr;
    //     if (this.verify(expr = this.FunctionCall())) {
    //         return expr;
    //     }
    //     this.restore(saved);
    //     if (this.verify(expr = this.Identifier())) {
    //         return expr;
    //     }
    //     this.restore(saved);
    //     if (this.verify(expr = this.LogicalLiteral())) {
    //         return expr;
    //     }
    //     this.restore(saved);
    //     if (this.Terminal("(", "operator") &&
    //         this.verify(expr = this.VariableAssignment()) && // for VarAssign => if 5 is (a = half(10)): # now u can use "a" as func result in AND after the if statement, DEBATE: is this syntax useful / replaceable / necesarry ? see walrus operator
    //         this.Terminal(")", "operator")
    //     ) {
    //         return expr;
    //     }
    //     this.restore(saved);
    //     if (this.Terminal("(", "operator") &&
    //         this.verify(expr = this.LogicalExpression()) && // for LogicalExpr if true and (false or 2 <= 3): # mandatory delimiting between or and and-expressions (not same (logical \ relational) expressions)
    //         this.Terminal(")", "operator")
    //     ) {
    //         return expr;
    //     }
    //     this.restore(saved);
    //     return null;
    // }

    // LogicalLiteral() {
    //     let saved = this.cursor;
    //     if (this.Terminal('true', 'reserved')) {
    //         return 'true';
    //     }
    //     this.restore(saved);
    //     if (this.Terminal('false', 'reserved')) {
    //         return 'false';
    //     }
    //     this.restore(saved);
    //     return null;
    // }

    AdditiveExpression() {
        let initial_1 = this.cursor, first, second;
        if (this.verify(first = this.MultiplicativeExpression())) {
            let initial_2 = this.cursor;
            if (this.Terminal("+", "operator") &&
                this.verify(second = this.AdditiveExpression())) {
                return ["binary +", first, second];
            }
            this.restore(initial_2);
            if (this.Terminal("-", "operator") &&
                this.verify(second = this.MultiplicativeExpression())
            ) {
                const lookaheadOperator = this.input[this.cursor]?.value;
                if (this.input[this.cursor]?.type === 'operator' && ['+', '-'].includes(lookaheadOperator)) {
                    this.cursor++; // skip actual sign
                    let third;
                    if (this.verify(third = this.AdditiveExpression()))
                        return [`binary ${lookaheadOperator}`, ["binary -", first, second], third];
                }
                return ["binary -", first, second];
            }
            return this.restore(initial_2), first;
        }
        return this.restore(initial_1), null;
    }

    MultiplicativeExpression() {
        let initial_1 = this.cursor, first, second;
        if (this.verify(first = this.TypeExpression())) {
            let initial_2 = this.cursor;
            if (this.Terminal("*", "operator") &&
                this.verify(second = this.MultiplicativeExpression())
            ) {
                return ["*", first, second];
            }
            this.restore(initial_2);
            if (this.Terminal("/", "operator") &&
                this.verify(second = this.TypeExpression())
            ) {
                let lookaheadOperator = this.input[this.cursor]?.value;
                if (this.input[this.cursor]?.type === 'operator' && ['*', '/'].includes(lookaheadOperator)) {
                    this.cursor++; // skip actual sign
                    let third;
                    if (this.verify(third = this.MultiplicativeExpression()))
                        return [lookaheadOperator, ["/", first, second], third];
                }
                return ["/", first, second];
            }
            return this.restore(initial_2), first;
        }
        return this.restore(initial_1), null;
    }

    TypeExpression() {
        let initial = this.cursor;
        let expression, type = false;
        if (this.Terminal('type', 'reserved') &&
            this.Terminal('of', 'reserved')) {
            type = true;
        } else {
            this.restore(initial);
        }
        if (this.verify(expression = this.UnaryExpression()))
            return type ? ['type', expression] : expression;

        return this.restore(initial), null;
    }

    UnaryExpression() {
        let initial = this.cursor;
        let expression;
        if (this.Terminal("+", "operator") &&
            this.verify(expression = this.PrimaryExpression())
        ) {
            return ["unary +", expression];
        }
        this.restore(initial);
        if (this.Terminal("-", "operator") &&
            this.verify(expression = this.PrimaryExpression())
        ) {
            return ["unary -", expression];
        }
        this.restore(initial);
        if (this.Terminal("not", "operator") &&
            this.verify(expression = this.PrimaryExpression())
        ) {
            return ["not", expression];
        }
        this.restore(initial);
        if (this.verify(expression = this.PrimaryExpression())) {
            return expression;
        }
        return this.restore(initial), null;
    }

    PrimaryExpression() {
        let initial = this.cursor;
        let expression;
        if (this.verify(expression = this.Literal())) {
            return expression;
        }
        this.restore(initial);
        if (this.verify(expression = this.FunctionCall())) {
            return expression;
        }
        this.restore(initial);
        if (this.verify(expression = this.Identifier())) {
            return expression;
        }
        this.restore(initial);
        if (this.Terminal("(", "operator") &&
            this.verify(expression = this.VariableAssignment()) && // for VarAssign => if 5 is (a = half(10)): # now u can use "a" as func result in AND after the if statement, DEBATE: is this syntax useful / replaceable / necesarry ? see walrus operator
            this.Terminal(")", "operator")
        ) {
            return expression;
        }
        this.restore(initial);
        if (this.Terminal("(", "operator") &&
            this.verify(expression = this.Expression()) && // for LogicalExpr if true and (false or 2 <= 3): # mandatory delimiting between or and and-expressions (not same (logical \ relational) expressions)
            this.Terminal(")", "operator")
        ) {
            return expression;
        }
        return this.restore(initial), null;
    }

    // TODO: TO reconsider for it to be faster than before + adapt to new func call syntax (vezi ce e cu "with" kw si "me" pt this)

    FunctionCall() { // TODO: FIXME: calls as arguments to other calls make program veeeeeeeery slow
        // Also normal calls using ( ... ) (parantheses with an expression) are taking veeeeery long time to exec 
        let initial = this.cursor;
        let name, args = { regular: [], named: [] };
        if (this.verify(name = this.Identifier())) { // TODO: also allow arrow fucntions instead of identifier, for IILE functionality
            if (this.Terminal("(", "operator") &&
                this.verify(args = this.ArgumentSequenceList()) &&
                this.Terminal(")", "operator")) {
                return [name, args];
            }

        }
        return this.restore(initial), null;
    }

    ArgumentSequenceList() {
        let initial = this.cursor, list = { regular: [], named: {} }, sequence;
        if (this.verify(sequence = this.ArgumentSequence())) {
            if (sequence.type === "regular") {
                list.regular.push(sequence.value);
            }
            if (sequence.type === "named") {
                list.named[sequence.name] = sequence.value;
            }
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.ArgumentSequence())) {
                    if (sequence.type === "regular") {
                        list.regular.push(sequence.value);
                    }
                    if (sequence.type === "named") {
                        // `example function call`(a = 1, b = 2, a = 3, a = 4)
                        if (list.named.hasOwnProperty(sequence.name))
                            ErrorHandler.SyntaxError(`You are not allowed to use duplicate named arguments (as '${sequence.name}' is used here) inside a function call.`);

                        list.named[sequence.name] = sequence.value;
                    }
                } else return this.restore(initial), null;
            }
        } else this.restore(initial);
        return list;
    }

    ArgumentSequence() {
        let initial = this.cursor, name, value;
        if (this.verify(name = this.Identifier())) {
            if (this.isSpacedIdentifier(name))
                name = name.slice(1, -1);

            if (this.Terminal('=', 'operator') &&
                this.verify(value = this.Expression())) {
                return { type: "named", name, value }
            }
        }
        this.restore(initial);
        if (this.verify(value = this.Expression())) {
            return { type: "regular", value };
        }
        return this.restore(initial), null;
    }

    Identifier() {
        let initial = this.cursor;
        if (this.input[this.cursor]?.kind === "identifier") {
            return this.input[this.cursor++].value;
        }
        this.restore(initial);
        return null;
    }

    Literal() {
        let initial = this.cursor, literal;
        return this.verify(literal = this.NumericLiteral())
            || (this.restore(initial), this.verify(literal = this.StringLiteral()))
            || (this.restore(initial), this.verify(literal = this.ReservedLiteral()))
            ? literal
            : (this.restore(initial), null);
    }

    NumericLiteral() {
        let initial = this.cursor;
        if (this.input[this.cursor]?.kind === "number") {
            return Number.parseFloat(this.input[this.cursor++].value);
        }
        this.restore(initial);
        return null;
    }

    StringLiteral() {
        let initial = this.cursor;
        if (this.input[this.cursor]?.kind === "string") {
            return this.input[this.cursor++].value;
        }
        this.restore(initial);
        return null;
    }

    ReservedLiteral() {
        let initial = this.cursor;
        if (this.input[this.cursor]?.kind === "reserved" &&
            ['true', 'false', 'nothing'].includes(this.input[this.cursor]?.value)) {
            return this.input[this.cursor++].value;
        }
        this.restore(initial);
        return null;
    }

    /**
     * @param {String} value - the actual content of the terminal
     * @param {String} kind  - the kind of the terminal, according to Target rules 
     */
    Terminal(value, kind) {
        let initial = this.cursor;
        return this.input[this.cursor]?.value === value
            && this.input[this.cursor]?.kind === kind
            ? (this.cursor++, true)
            : (this.restore(initial), false);
    }
}