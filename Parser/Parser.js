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

class Parser {
    parse(input) {
        if(typeof input !== "object" || input.constructor.name !== "Array")
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
        return this.output; /*['begin', 'nothing'];*/
    }

    verify(value) {
        return value !== null;
    }

    restore(saved) {
        this.cursor = saved;
    }

    Program() {
        let saved = this.cursor;
        let stmtList;
        if (this.verify(stmtList = this.StatementList())) {
            return stmtList;
        }
        this.restore(saved);
        return ['begin', 'nothing']; // program that does nothing, valid in Target for the moment (represents support for empty / description-using-comments files)
    }

    StatementList() {
        let saved = this.cursor, list = ['begin'], stmt;
        if (this.verify(stmt = this.Statement())) {
            list.push(stmt);
            while (this.verify(stmt = this.Statement())) {
                list.push(stmt);
            }
            return list;
        }
        this.restore(saved);
        return null;
    }

    Statement() {
        let saved = this.cursor;
        let expr;
        if (this.verify(expr = this.PrintStatement())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.ErrorStatement())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.VariableDeclaration())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.FunctionDeclaration())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.IfStatement())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.WhileStatement())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.Expression()) &&
            this.Terminal('', 'EOL')) {
            return expr;
        }
        this.restore(saved);
        return null;
    }

    PrintStatement() {
        let saved = this.cursor, list = [], sequence;
        if (this.Terminal('print', 'reserved') &&
            this.verify(sequence = this.Expression())) {
            list.push(sequence);
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.Expression())) {
                    list.push(sequence);
                } else {
                    this.restore(saved);
                    return null;
                }
            }
            if (this.Terminal("", "EOL")) {
                return ['print', ...list];
            }
        }
        this.restore(saved);
        return null;
    }

    ErrorStatement() {
        let saved = this.cursor;
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
        this.restore(saved);
        return null;
    }

    VariableDeclaration() {
        let saved = this.cursor;
        let list;
        if (this.Terminal('var', 'reserved') &&
            this.verify(list = this.VariableSequenceList()) &&
            this.Terminal("", "EOL")
        ) {
            return ['var', ...list];
        }
        this.restore(saved);
        return null;
    }

    VariableSequenceList() {
        let saved = this.cursor, list = [], sequence;
        if (this.verify(sequence = this.VariableSequence())) {
            list.push(sequence);
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.VariableSequence())) {
                    list.push(sequence);
                } else {
                    this.restore(saved);
                    return null;
                }
            }
            return list;
        }
        this.restore(saved);
        return null;
    }

    VariableSequence() {
        let name, value, saved = this.cursor;
        if (this.verify(name = this.Identifier()) &&
            this.Terminal('=', 'operator') &&
            this.verify(value = this.Expression())) {
            return [name, value];
        }
        this.restore(saved);
        if (this.verify(name = this.Identifier())) {
            return [name, 'nothing'];
        }
        this.restore(saved);
        return null;
    }

    FunctionDeclaration() {
        let saved = this.cursor;
        let name, params, body;
        if (this.Terminal('func', 'reserved') &&
            this.verify(name = this.Identifier()) &&
            this.Terminal('(', 'operator') &&
            this.verify(params = this.ParameterSequenceList()) &&
            this.Terminal(')', 'operator') &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal("", "EOL") &&
            this.Terminal("", "INDENT") &&
            this.verify(body = this.StatementList()) &&
            this.Terminal("", "DEDENT")
        ) {
            return ['func', name, params.unnamed, params.named, body];
        }
        this.restore(saved);
        return null;
    }

    ParameterSequenceList() {
        let saved = this.cursor, list = { unnamed: [], named: [] }, sequence, identifier;
        if (this.verify(sequence = this.ParameterSequence())) {
            list[sequence.type].push({ name: sequence.name, value: sequence.value });
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.ParameterSequence())) {
                    list[sequence.type].push({ name: sequence.name, value: sequence.value });
                } else {
                    this.restore(saved);
                    return null;
                }
            }
        } else {
            this.restore(saved);
        }

        // func `example function`(a, b, c, d, d, d):
        //     <code>
        if ((identifier = list.unnamed.map(sequence => sequence.name).find((item, index) => list.unnamed.map(sequence => sequence.name).lastIndexOf(item) !== index)) !== undefined)
            ErrorHandler.SyntaxError(`You are not allowed to use duplicate unnamed parameter names (as '${identifier}' is used here) inside a function declaration.`);

        // func `example function`(:a, :b, :c, :d, :d, :d):
        //     <code>
        if ((identifier = list.named.map(sequence => sequence.name).find((item, index) => list.named.map(sequence => sequence.name).lastIndexOf(item) !== index)) !== undefined)
            ErrorHandler.SyntaxError(`You are not allowed to use duplicate named parameter names (as '${identifier}' is used here) inside a function declaration.`);

        // func `example function`(a, b, c, :a, :b, :c):
        //     <code>
        if((identifier = list.unnamed.map(sequence => sequence.name).find(item => ~list.named.map(sequence => sequence.name).indexOf(item))))
            ErrorHandler.SyntaxError(`You are not allowed to use the same identifier for a named and an unnamed parameter (as '${identifier}' is used here) inside a function declaration.`)
        
        return list;
    }

    ParameterSequence() {
        let type = "unnamed", name, value, save1 = this.cursor;
        if (this.Terminal(':', 'punctuator')) {
            type = "named";
        }
        let save2 = this.cursor;
        if (this.verify(name = this.Identifier()) &&
            this.Terminal('=', 'operator') &&
            this.verify(value = this.Expression())) {
            return { type, name, value };
        }
        this.restore(save2);
        if (this.verify(name = this.Identifier())) {
            return { type, name, value: "nothing" };
        }
        this.restore(save1);
        return null;
    }

    IfStatement() {
        let saved = this.cursor;
        let condition, consequence, alternative;

        if (this.Terminal('if', 'reserved') &&
            this.verify(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.verify(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT') &&
            this.Terminal('else', 'reserved') &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.verify(alternative = this.StatementList()) &&
            this.Terminal('', 'DEDENT')
        ) {
            return ['if', condition, consequence, alternative];
        }
        this.restore(saved);
        if (this.Terminal('if', 'reserved') &&
            this.verify(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.verify(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT') &&
            this.Terminal('else', 'reserved')) {
            let save2 = this.cursor;
            if (this.verify(alternative = this.IfStatement())) {
                return ['if', condition, consequence, alternative];
            }
            this.restore(save2);
            if (this.verify(alternative = this.WhileStatement())) {
                return ['if', condition, consequence, alternative];
            }
        }
        this.restore(saved);
        if (this.Terminal('if', 'reserved') &&
            this.verify(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.verify(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT')
        ) {
            return ['if', condition, consequence];
        }
        this.restore(saved);
        return null;
    }

    WhileStatement() {
        let saved = this.cursor;
        let condition, consequence;
        if (this.Terminal('while', 'reserved') &&
            this.verify(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.verify(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT')
        ) {
            return ['while', condition, consequence];
        }
        this.restore(saved);
        return null;
    }

    Expression() {
        let saved = this.cursor;
        let expr;
        if (this.verify(expr = this.VariableAssignment())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.LogicalExpression())) {
            return expr;
        }
        this.restore(saved);
        return null;
    }

    VariableAssignment() {
        let saved = this.cursor;
        let name, value;

        if (this.verify(name = this.Identifier()) &&
            this.Terminal('=', 'operator') &&
            this.verify(value = this.Expression())
        ) {
            return ['assign', name, value];
        }
        this.restore(saved);
        return null;
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

    // TO BE OPTIMIZED IN THE FUTURE

    /**
     * @ebnf LogicalExpression = EqualityExpression 'and' AndExpression
     *                         | EqualityExpression 'or' OrExpression
     *                         | EqualityExpression
     *                         ; 
     */
    LogicalExpression() {
        let saved = this.cursor, firstOperand, secondOperand;
        if (this.verify(firstOperand = this.EqualityExpression())) {
            let save2 = this.cursor;
            if (this.Terminal('and', 'operator') &&
                this.verify(secondOperand = this.AndExpression())) {
                return ['and', firstOperand, secondOperand];
            }
            this.restore(save2);
            if (this.Terminal('or', 'operator') &&
                this.verify(secondOperand = this.OrExpression())) {
                return ['or', firstOperand, secondOperand];
            }
            this.restore(save2);
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    AndExpression() {
        let saved = this.cursor, firstOperand, secondOperand;
        if (this.verify(firstOperand = this.EqualityExpression()) &&
            this.Terminal('and', 'operator') &&
            this.verify(secondOperand = this.AndExpression())) {
            return ['and', firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.EqualityExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return firstOperand;
    }

    OrExpression() {
        let saved = this.cursor, firstOperand, secondOperand;
        if (this.verify(firstOperand = this.EqualityExpression()) &&
            this.Terminal('or', 'operator') &&
            this.verify(secondOperand = this.OrExpression())) {
            return ['or', firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.EqualityExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return firstOperand;
    }

    EqualityExpression() {
        let saved = this.cursor, firstOperand, secondOperand;
        // conteaza ca instructiunea cu clauza "is not" sa fie inaintea instructiunii cu clauza pentru "is"
        if (this.verify(firstOperand = this.RelationalExpression()) &&   // special 'is not' case is here because a !== b not equiv. of a === !b
            this.Terminal('is', 'operator') &&
            this.Terminal('not', 'operator') &&
            this.verify(secondOperand = this.RelationalExpression())
        ) {
            return ['is not', firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.RelationalExpression()) &&
            this.Terminal('is', 'operator') &&
            this.verify(secondOperand = this.RelationalExpression())
        ) {
            return ['is', firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.RelationalExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    RelationalExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;
        if (this.verify(firstOperand = this.AdditiveExpression()) &&
            this.Terminal("<", "operator") &&
            this.verify(secondOperand = this.AdditiveExpression())
        ) {
            return ["<", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.AdditiveExpression()) &&
            this.Terminal(">", "operator") &&
            this.verify(secondOperand = this.AdditiveExpression())
        ) {
            return [">", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.AdditiveExpression()) &&
            this.Terminal("<=", "operator") &&
            this.verify(secondOperand = this.AdditiveExpression())
        ) {
            return ["<=", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.AdditiveExpression()) &&
            this.Terminal(">=", "operator") &&
            this.verify(secondOperand = this.AdditiveExpression())
        ) {
            return [">=", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.AdditiveExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
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
        let saved = this.cursor;
        let firstOperand,
            secondOperand;
        if (this.verify(firstOperand = this.MultiplicativeExpression()) &&
            this.Terminal("+", "operator") &&
            this.verify(secondOperand = this.AdditiveExpression())
        ) {
            return ["binary +", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.MultiplicativeExpression()) &&
            this.Terminal("-", "operator") &&
            this.verify(secondOperand = this.MultiplicativeExpression())
        ) {
            let lookaheadOperator = this.input[this.cursor]?.value;
            if (lookaheadOperator === "+" || lookaheadOperator === "-") {
                this.cursor++; // skip actual sign
                let thirdOperand;
                if (this.verify(thirdOperand = this.AdditiveExpression()))
                    return [`binary ${lookaheadOperator}`, ["binary -", firstOperand, secondOperand], thirdOperand];
            }
            return ["binary -", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.MultiplicativeExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    MultiplicativeExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;
        if (this.verify(firstOperand = this.UnaryExpression()) &&
            this.Terminal("*", "operator") &&
            this.verify(secondOperand = this.MultiplicativeExpression())
        ) {
            return ["*", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.UnaryExpression()) &&
            this.Terminal("/", "operator") &&
            this.verify(secondOperand = this.UnaryExpression())
        ) {
            let lookaheadOperator = this.input[this.cursor]?.value;
            if (lookaheadOperator === "*" || lookaheadOperator === "/") {
                this.cursor++; // skip actual sign
                let thirdOperand;
                if (this.verify(thirdOperand = this.MultiplicativeExpression()))
                    return [lookaheadOperator, ["/", firstOperand, secondOperand], thirdOperand];
            }
            return ["/", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.verify(firstOperand = this.TypeExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    TypeExpression() {
        let saved = this.cursor;
        let expr, type = false;
        if (this.Terminal('type', 'reserved') &&
            this.Terminal('of', 'reserved')) {
            type = true;
        } else {
            this.restore(saved);
        }
        if (this.verify(expr = this.UnaryExpression())) {
            return type ? ['type', expr] : expr;
        }
        this.restore(saved);
        return null;
    }

    UnaryExpression() {
        let saved = this.cursor;
        let expr;
        if (this.Terminal("+", "operator") &&
            this.verify(expr = this.PrimaryExpression())
        ) {
            return ["unary +", expr];
        }
        this.restore(saved);
        if (this.Terminal("-", "operator") &&
            this.verify(expr = this.PrimaryExpression())
        ) {
            return ["unary -", expr];
        }
        this.restore(saved);
        if (this.Terminal("not", "operator") &&
            this.verify(expr = this.PrimaryExpression())
        ) {
            return ["not", expr];
        }
        this.restore(saved);
        if (this.verify(expr = this.PrimaryExpression())) {
            return expr;
        }
        this.restore(saved);
        return null;
    }

    PrimaryExpression() {
        let saved = this.cursor;
        let expr;
        if (this.verify(expr = this.FunctionCall())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.Identifier())) {
            return expr;
        }
        this.restore(saved);
        if (this.verify(expr = this.Literal())) {
            return expr;
        }
        this.restore(saved);
        if (this.Terminal("(", "operator") &&
            this.verify(expr = this.VariableAssignment()) && // for VarAssign => if 5 is (a = half(10)): # now u can use "a" as func result in AND after the if statement, DEBATE: is this syntax useful / replaceable / necesarry ? see walrus operator
            this.Terminal(")", "operator")
        ) {
            return expr;
        }
        this.restore(saved);
        if (this.Terminal("(", "operator") &&
            this.verify(expr = this.Expression()) && // for LogicalExpr if true and (false or 2 <= 3): # mandatory delimiting between or and and-expressions (not same (logical \ relational) expressions)
            this.Terminal(")", "operator")
        ) {
            return expr;
        }
        this.restore(saved);
        return null;
    }

    // TODO: TO reconsider for it to be faster than before + adapt to new func call syntax (vezi ce e cu "with" kw si "me" pt this)
    // TODO: FUTUREPLAN: DEBATE: add and allow ONLY named parameters => arguments will look like assignments: purchase(account = myAcc, money = 499.99, currency = "EUR")

    FunctionCall() { // TODO: FIXME: calls as arguments to other calls make program veeeeeeeery slow
        // Also normal calls using ( ... ) (parantheses with an expression) are taking veeeeery long time to exec 
        let saved = this.cursor;
        let name, args = { unnamed: [], named: [] };
        if (this.verify(name = this.Identifier()) &&
            this.Terminal("(", "operator") &&
            this.verify(args = this.ArgumentSequenceList()) &&
            this.Terminal(")", "operator")) {
            return [name, args];
        }
        this.restore(saved);
        return null;
    }

    ArgumentSequenceList() {
        let saved = this.cursor, list = { unnamed: [], named: {} }, sequence;
        if (this.verify(sequence = this.ArgumentSequence())) {
            if (sequence.type === "unnamed") {
                list.unnamed.push(sequence.value);
            }
            if (sequence.type === "named") {
                list.named[sequence.name] = sequence.value;
            }
            while (this.Terminal(',', 'operator')) {
                if (this.verify(sequence = this.ArgumentSequence())) {
                    if (sequence.type === "unnamed") {
                        list.unnamed.push(sequence.value);
                    }
                    if (sequence.type === "named") {
                        
                        // `example function`(argument = 1, argument = 2, argument = 3)
                        if (list.named.hasOwnProperty(sequence.name))
                            ErrorHandler.SyntaxError(`You are not allowed to use duplicate named arguments (as '${sequence.name}' is used here) inside a function call.`);
            
                        list.named[sequence.name] = sequence.value;
                    }
                } else {
                    this.restore(saved);
                    return null;
                }
            }
        } else {
            this.restore(saved);
        }
        return list;
    }

    ArgumentSequence() {
        let name, value, saved = this.cursor;
        if (this.verify(name = this.Identifier()) &&
            this.Terminal('=', 'operator') &&
            this.verify(value = this.Expression())) {
            return { type: "named", name, value };
        }
        this.restore(saved);
        if (this.verify(value = this.Expression())) {
            return { type: "unnamed", value };
        }
        this.restore(saved);
        return null;
    }

    Identifier() {
        let saved = this.cursor;
        if (this.input[this.cursor]?.kind === "identifier") {
            return this.input[this.cursor++].value;
        }
        this.restore(saved);
        return null;
    }

    Literal() {
        let saved = this.cursor, literal;
        if (this.verify(literal = this.NumericLiteral())) {
            return literal;
        }
        this.restore(saved);
        if (this.verify(literal = this.StringLiteral())) {
            return literal;
        }
        this.restore(saved);
        if (this.verify(literal = this.ReservedLiteral())) {
            return literal;
        }
        this.restore(saved);
        return null;
    }

    NumericLiteral() {
        let saved = this.cursor;
        if (this.input[this.cursor]?.kind === "number") {
            return Number.parseFloat(this.input[this.cursor++].value);
        }
        this.restore(saved);
        return null;
    }

    StringLiteral() {
        let saved = this.cursor;
        if (this.input[this.cursor]?.kind === "string") {
            return this.input[this.cursor++].value;
        }
        this.restore(saved);
        return null;
    }

    ReservedLiteral() {
        let saved = this.cursor;
        if (this.input[this.cursor]?.kind === "reserved" &&
            ['true', 'false', 'nothing'].includes(this.input[this.cursor]?.value)) {
            return this.input[this.cursor++].value;
        }
        this.restore(saved);
        return null;
    }

    /**
     * @param {String} value - the actual content of the terminal
     * @param {String} kind  - the kind of the terminal, according to Target rules 
     */
    Terminal(value, kind) {
        let saved = this.cursor;
        if (this.input[this.cursor]?.value === value &&
            this.input[this.cursor]?.kind === kind
        ) {
            this.cursor++;
            return true;
        }
        this.restore(saved);
        return false;
    }
}

/*
///////////////////////////////////////////////////////////////////
    Program() {
        let saved = this.cursor;
        let stmtList;
        if ((stmtList = this.StatementList()) !== false) {
            return stmtList;
        }

        this.restore(saved);

        return null;
    }

    StatementList() {
        let saved = this.cursor;
        let stmt, stmtList;
        if (
            ((stmt = this.Statement()) !== false) &&
            ((stmtList = this.StatementList()) !== false)
        ) {
            if (Array.isArray(stmtList) && stmtList[0] === "begin") // FIXME: refacere sintaxa linia 37-42
                return ["begin", stmt, ...(stmtList.slice(1))];
            return ["begin", stmt, stmtList];
        }
        this.restore(saved);

        if ((stmt = this.Statement()) !== false) {
            return stmt;
        }
        return null;
    }

    // solve if types problems
    Statement() {
        let saved = this.cursor;
        let expr, end;

        if ((expr = this.VariableDeclarationList()) !== false) {
            return expr; // de transformat in statement
        }

        this.restore(saved);

        // now needs a trailing enter independent of the structure
        if ((expr = this.Expression()) !== false &&
            (["if", "while"].includes(expr[0]) || this.Terminal('', 'EOL') !== false)) {
            return expr; // de revazut eventuale probleme cu DEDENT ce apare in cazuri neprevazute
        }

        this.restore(saved);

        return null;
    }

    Expression() {
        let saved = this.cursor;
        let expr;

        if ((expr = this.IfStatement()) !== false)
            return expr;

        this.restore(saved);

        if ((expr = this.WhileExpression()) !== false)
            return expr;

        this.restore(saved);

        if ((expr = this.VariableAssignment()) !== false)
            return expr;

        this.restore(saved);

        if ((expr = this.LogicalExpression()) !== false)    //
            return expr;                                    // should this be here?
        // (is EBNF correct in this case?)
        this.restore(saved);                                //

        if ((expr = this.AdditiveExpression()) !== false)   //
            return expr;                                    // should this be here?

        this.restore(saved);

        return null;
    }

    VariableAssignment() {
        let saved = this.cursor;
        let name, value;

        if ((name = this.Identifier()) !== false &&
            this.Terminal('=', 'operator') !== false &&
            (value = this.Expression()) !== false) {
            return ['assign', name, value];
        }

        this.restore(saved);

        return false;
    }

    VariableDeclarationList() {
        let saved = this.cursor;
        let name, value;

        if (this.Terminal('var', 'reserved') !== false &&
            (name = this.Identifier()) !== false &&
            this.Terminal('=', 'operator') !== false &&
            (value = this.Expression()) !== false &&    // TODO: FIXME: !!!! assignment expression should be treated here as declaration
            this.Terminal('', 'EOL') !== false) {
            // if(Array.isArray(value) && value[0] === "assign") {
            //      fix place (to be made recursively after value[2], case of "var a = b = c = d = e = f = 42")
            // }
            return ['var', name, value];
        }

        this.restore(saved);

        if (this.Terminal('var', 'reserved') !== false &&
            (name = this.Identifier()) !== false &&
            this.Terminal('', 'EOL') !== false) {
            return ['var', name, 'nothing'];
        }

        this.restore(saved);

        return false;
    }

    // de facut bucla for, for-each (for element in array) si for ca varianta extinsa de foreach, pt numar si array de numere generat la runtime prin sintaxa nr1...nr2 (for

    WhileExpression() {
        let saved = this.cursor;
        let condition, consequence;
        if (this.Terminal('while', 'reserved') !== false &&
            (condition = this.LogicalExpression()) !== false &&
            this.Terminal(':', 'punctuator') !== false &&
            this.Terminal('', 'EOL') !== false &&
            this.Terminal('', 'INDENT') !== false &&
            (consequence = this.StatementList()) !== false &&
            this.Terminal('', 'DEDENT') !== false) {
            return ['while', condition, consequence];
        }

        this.restore(saved);

        return false;
    }

    IfStatement() {
        let saved = this.cursor;
        let condition, consequence, alternative;

        if (this.Terminal('if', 'reserved') !== false &&
            (condition = this.LogicalExpression()) !== false &&
            this.Terminal(':', 'punctuator') !== false &&
            this.Terminal('', 'EOL') !== false &&
            this.Terminal('', 'INDENT') !== false &&
            (consequence = this.StatementList()) !== false &&
            this.Terminal('', 'DEDENT') !== false &&
            this.Terminal('else', 'reserved') !== false &&
            (alternative = this.IfStatement()) !== false) {
            return ['if', condition, consequence, alternative];
        }

        this.restore(saved);

        if (this.Terminal('if', 'reserved') !== false &&
            (condition = this.LogicalExpression()) !== false &&
            this.Terminal(':', 'punctuator') !== false &&
            this.Terminal('', 'EOL') !== false &&
            this.Terminal('', 'INDENT') !== false &&
            (consequence = this.StatementList()) !== false &&
            this.Terminal('', 'DEDENT') !== false &&
            this.Terminal('else', 'reserved') !== false &&
            (alternative = this.WhileExpression()) !== false) {
            return ['if', condition, consequence, alternative];
        }

        this.restore(saved);

        if (this.Terminal('if', 'reserved') !== false &&
            (condition = this.LogicalExpression()) !== false &&
            this.Terminal(':', 'punctuator') !== false &&
            this.Terminal('', 'EOL') !== false &&
            this.Terminal('', 'INDENT') !== false &&
            (consequence = this.StatementList()) !== false &&
            this.Terminal('', 'DEDENT') !== false &&
            this.Terminal('else', 'reserved') !== false &&
            this.Terminal(':', 'punctuator') !== false &&
            this.Terminal('', 'EOL') !== false &&
            this.Terminal('', 'INDENT') !== false &&
            (alternative = this.StatementList()) !== false &&
            this.Terminal('', 'DEDENT') !== false) {
            return ['if', condition, consequence, alternative];
        }

        this.restore(saved);

        if (this.Terminal('if', 'reserved') !== false &&
            (condition = this.LogicalExpression()) !== false &&
            this.Terminal(':', 'punctuator') !== false &&
            this.Terminal('', 'EOL') !== false &&
            this.Terminal('', 'INDENT') !== false &&
            (consequence = this.StatementList()) !== false &&
            this.Terminal('', 'DEDENT') !== false) {
            return ['if', condition, consequence];
        }

        this.restore(saved);

        return false;
    }

    // TODO: FIXME: DEBATE: logical literal should be higher or equal on level to additive <===> should be separate branches in expression rule instead of parent-child branches?
    // TODO: FIXME: commentariul pe o linie terminala a programului (pe ultima) da erori in parsing => posibil problema in tokenizing, de aflat
    LogicalExpression() {
        // TODO: de vazut daca logical expression poate ramane pe acelasi nivel cu addition sau trebuie sa fie ierarhizate
        // pe moment, singurul timp in care se intra pe if este daca conditia nu are valoarea "false" (nu se face in interior NICIO CONVERSIE DE TIP FALSY ex. 0 catre false)
        let saved = this.cursor;
        let firstOperand,
            secondOperand;

        // de studiat f bine precedenta intre operatorii && si || +
        // vrem sa dam eroare de compilare daca nu se separa accordingly? ACUM NU OFERA, dar poate fi schimbat, in prezenta clauzelor de lookahead
        // ^^^^^^^^^^^^^^^^^^^^^ https://docs.microsoft.com/en-us/cpp/c-language/precedence-and-order-of-evaluation?view=msvc-160#:~:text=The%20logical%2DAND%20operator%20(%20%26%26,is%20evaluated%20before%20s%2D%2D%20.

        if ((firstOperand = this.EqualityExpression()) !== false &&
            this.Terminal('or', 'operator') !== false &&
            (secondOperand = this.LogicalExpression()) !== false) {
            // if (Array.isArray(secondOperand) && secondOperand[0] === "and") {
            //     ErrorHandler.SyntaxError(`AND and OR-expressions undelimited accordingly`); // <= facem ca && si || sa aiba acelasi precedence si sa trebuiasca obligatoriu separati prin paranteze daca se folosesc impreuna unul langa celalalt
            // }
            return ['or', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.EqualityExpression()) !== false &&
            this.Terminal('and', 'operator') !== false &&
            (secondOperand = this.LogicalExpression()) !== false) {
            // if (Array.isArray(secondOperand) && secondOperand[0] === "or") { // vezi cazul in care avem paranteze ca primary-expression aici (nu face diferenta intre and din bool-expr si cel din primary-expr)
            //     ErrorHandler.SyntaxError(`AND and OR-expressions undelimited accordingly`); // <= facem ca && si || sa aiba acelasi precedence si sa trebuiasca obligatoriu separati prin paranteze daca se folosesc impreuna unul langa celalalt
            // }
            return ['and', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.EqualityExpression()) !== false) {
            return firstOperand;
        }

        this.restore(saved);

        return false;
    }

    EqualityExpression() {

        let saved = this.cursor,
            firstOperand, secondOperand;

        this.restore(saved);
        // conteaza ca instructiunea cu clauza "is not" sa fie inaintea instructiunii cu clauza pentru "is"
        if ((firstOperand = this.RelationalExpression()) !== false &&   // special is not case, a !== b not equiv. of a === !b
            this.Terminal('is', 'operator') !== false &&
            this.Terminal('not', 'operator') !== false &&
            (secondOperand = this.RelationalExpression()) !== false) {
            return ['is not', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.RelationalExpression()) !== false &&
            this.Terminal('is', 'operator') !== false &&
            (secondOperand = this.RelationalExpression()) !== false) {
            return ['is', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.RelationalExpression()) !== false) {
            return firstOperand;
        }

        this.restore(saved);

        return false;
    }

    RelationalExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;

        // URMATOAREA NU ESTE O INLANTUIRE VALIDA SI NICI LOGIC CORECTA:
        // 2 < 3 < 4 <=> 2 < true, dar +true = 1 (conversie implicita) <=> 2 < 1 false

        if (
            (firstOperand = this.AdditiveExpression()) !== false &&
            this.Terminal('<', 'operator') !== false &&
            (secondOperand = this.AdditiveExpression()) !== false) {
            return ['<', firstOperand, secondOperand];
        }

        this.restore(saved);

        if (
            (firstOperand = this.AdditiveExpression()) !== false &&
            this.Terminal('>', 'operator') !== false &&
            (secondOperand = this.AdditiveExpression()) !== false) {
            return ['>', firstOperand, secondOperand];
        }

        this.restore(saved);

        if (
            (firstOperand = this.AdditiveExpression()) !== false &&
            this.Terminal('<=', 'operator') !== false &&
            (secondOperand = this.AdditiveExpression()) !== false) {
            return ['<=', firstOperand, secondOperand];
        }

        this.restore(saved);

        if (
            (firstOperand = this.AdditiveExpression()) !== false &&
            this.Terminal('>=', 'operator') !== false &&
            (secondOperand = this.AdditiveExpression()) !== false) {
            return ['>=', firstOperand, secondOperand];
        }

        this.restore(saved);

        if (this.Terminal('not', 'operator') !== false &&           // => aici ar fi cel mai bun loc pt operatorul "not" astfel incat sa nu obligam programul sa realizeze conversii inutile
            (firstOperand = this.LogicalLiteral()) !== false) { // => daca era BoolExpr: ! a > 5 era = cu !(a > 5)
            return ['not', firstOperand];                           // => daca era AddExpr: !a + 1 era = cu true + 1 sau false + 1, dupa caz ===> eroare de compilare
        }                                                           // TODO: DEBATE: cum incadram operatorul not (se poate incadra la op relationali?) + ar trebui mutat altundeva sau sa detina sectiune proprie (poate cu unary plus si minus???), de vazut

        this.restore(saved);

        if ((firstOperand = this.LogicalLiteral()) !== false) { // should there be no "nothing" statement involved????, check case "if nothing: ..."
            return firstOperand;
        }

        this.restore(saved);

        return false;
    }

    LogicalLiteral() {

        let saved = this.cursor;
        let firstOperand;

        if ((firstOperand = this.Terminal("true", "reserved")) !== false ||     // prove me wrong
            (firstOperand = this.Terminal("false", "reserved")) !== false ||
            (firstOperand = this.Terminal("nothing", "reserved")) !== false) {
            return firstOperand;
        }
        this.restore(saved);

        return false;
    }

    AdditiveExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;

        if (
            (firstOperand = this.MultiplicativeExpression()) !== false &&
            this.Terminal('+', 'operator') !== false &&
            (secondOperand = this.AdditiveExpression()) !== false) {
            return ['+', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.MultiplicativeExpression()) !== false &&
            this.Terminal('-', 'operator') !== false &&
            (secondOperand = this.MultiplicativeExpression()) !== false) {
            let lookaheadOperator = this.input[this.cursor]?.value;
            if (lookaheadOperator === "+" || lookaheadOperator === "-") { // or lookaheadOperator.prec > my.prec; ==> lookaheadOperator precedence should make him evaluate before minus
                this.cursor++; // skip actual sign
                let nextOperand;
                if ((nextOperand = this.AdditiveExpression()) !== false)
                    return [lookaheadOperator, ['-', firstOperand, secondOperand], nextOperand];
            }
            return ['-', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.MultiplicativeExpression()) !== false) {
            return firstOperand;
        }

        this.restore(saved);

        return false;
    }

    MultiplicativeExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;

        if ((firstOperand = this.UnaryExpression()) !== false &&
            this.Terminal('*', 'operator') !== false &&
            (secondOperand = this.MultiplicativeExpression()) !== false
        ) {
            return ['*', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.UnaryExpression()) !== false &&
            (this.Terminal('/', 'operator') !== false &&
                (secondOperand = this.UnaryExpression()) !== false)
        ) {
            let lookaheadOperator = this.input[this.cursor]?.value;
            if (lookaheadOperator === "*" || lookaheadOperator === "/") {// or lookaheadOperator.prec > my.prec; ==> lookaheadOperator precedence should make him evaluate before minus
                this.cursor++; // skip actual sign
                let nextOperand;
                if ((nextOperand = this.AdditiveExpression()) !== false)
                    return [lookaheadOperator, ['/', firstOperand, secondOperand], nextOperand];
            }
            return ['/', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.UnaryExpression()) !== false) {
            return firstOperand;
        }

        this.restore(saved);

        return false;
    }

    UnaryExpression() {
        let saved = this.cursor;
        let firstOperand;

        // + and - unary here

        if (this.Terminal('not', 'operator') !== false &&           // => aici ar fi cel mai bun loc pt operatorul "not" astfel incat sa nu obligam programul sa realizeze conversii inutile
            (firstOperand = this.PrimaryExpression()) !== false) {      // => daca era BoolExpr: ! a > 5 era = cu !(a > 5)
            return ['not', firstOperand];                               // => daca era AddExpr: !a + 1 era = cu true + 1 sau false + 1, dupa caz ===> eroare de compilare
        }                                                           // TODO: DEBATE: cum incadram operatorul not (se poate incadra la op relationali?) + ar trebui mutat altundeva sau sa detina sectiune proprie (poate cu unary plus si minus???), de vazut

        this.restore(saved);

        if ((firstOperand = this.PrimaryExpression()) !== false) {
            return firstOperand;
        }

        this.restore(saved);

        return false;
    }

    PrimaryExpression() {
        let saved = this.cursor;
        let expr;

        if ((this.Terminal('(', 'operator') !== false) &&
            ((expr = this.LogicalExpression()) !== false) && // !== Expression bcz we might have the following JS-invalid code: 2 + ( if a is 0: ...if-expr... )
            (this.Terminal(')', 'operator') !== false)
        ) {
            return expr;
        }

        this.restore(saved);

        if ((expr = this.Identifier()) !== false) {
            return expr;
        }

        this.restore(saved);

        if ((expr = this.Literal()) !== false) {
            return expr;
        }

        this.restore(saved);

        return false;
    }

    Identifier() {
        let saved = this.cursor;

        if (this.input[this.cursor]?.kind === "identifier") {
            return this.input[this.cursor++].value;
        }

        this.restore(saved);

        return false;
    }

    Literal() {
        let saved = this.cursor;

        if (this.input[this.cursor]?.kind === "number") {
            return Number.parseFloat(this.input[this.cursor++].value);
        }

        this.restore(saved);

        if (this.input[this.cursor]?.kind === "string") {
            return this.input[this.cursor++].value;
        }

        this.restore(saved);

        if (this.Terminal("true", "reserved") !== false ||
            this.Terminal("false", "reserved") !== false ||
            this.Terminal("nothing", "reserved") !== false) {
            return this.input[this.cursor].value;
        }

        this.restore(saved);

        return false;
    }

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