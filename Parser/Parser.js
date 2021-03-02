// Establish if code from here is going in accord to the EBNF file

class Parser {
    parse(input) {
        this.input = input;
        this.cursor = 0;
        this.savedCursor = this.cursor;
        this.output = this.Program();
        if (this.cursor > this.input.length) ErrorHandler.SyntaxError(`Unexpected end of input`);
        else if (this.cursor < this.input.length) {
            console.warn(this.output);
            ErrorHandler.SyntaxError(`(${this.input[this.cursor].line} : ${this.input[this.cursor].column}), near "${this.input[this.cursor].value}"`);
        }
        console.log(`output: ${JSON.stringify(this.output, null, 4)}`, this.output, `, cursor: ${this.cursor}, input.length: ${this.input.length}`);
        return this.output; /*['begin', 'nothing'];*/
    }

    check(value) {
        return value !== null;
    }

    restore(saved) {
        this.cursor = saved;
    }

    Program() {
        let saved = this.cursor;
        let stmtList;
        if (this.check(stmtList = this.StatementList())) {
            return stmtList;
        }
        this.restore(saved);
        return null;
    }

    StatementList() {
        let stmt, stmtList = ["begin"];
        while (this.check(stmt = this.Statement())) {
            stmtList.push(stmt);
        }
        if(stmtList.length > 1) {
            return stmtList;
        }
        this.restore(saved);
        return null;
    }

    Statement() {
        let saved = this.cursor;
        let expr;
        if (this.check(expr = this.VariableDeclaration())) {
            return expr;
        }
        if (this.check(expr = this.FunctionDeclaration())) { // ~
            return expr;
        }
        this.restore(saved);
        if (this.check(expr = this.Expression())) {
            if(["if", "while"].includes(expr[0])) {
                return expr;
            }
            if(this.Terminal('', 'EOL')) {
                return expr;
            }
        }
        this.restore(saved);
        return null;
    }
    FunctionDeclaration() {
        return null;
    }

    VariableDeclaration() {
        let saved = this.cursor;
        let name, value;
        if (this.Terminal('var', 'reserved') &&
            this.check(name = this.Identifier()) &&
            this.Terminal('=', 'operator') &&
            this.check(value = this.Expression()) &&
            this.Terminal("", "EOL")
        ) {
            return ['var', name, value];
        }
        this.restore(saved);
        if (this.Terminal('var', 'reserved') &&
            this.check(name = this.Identifier()) &&
            this.Terminal("", "EOL")
        ) {
            return ['var', name, 'nothing'];
        }
        this.restore(saved);
        return null;
        // create var a = b = c = d = e = f = 5; <== ultima va trb sa fie var_decl cu valoare, restul, cu val_decl din ce se returneaza
    }

    Expression() {
        let saved = this.cursor;
        let expr;
        if (this.check(expr = this.IfExpression())) {
            return expr;
        }
        this.restore(saved);
        if (this.check(expr = this.WhileExpression())) {
            return expr;
        }
        this.restore(saved);
        if (this.check(expr = this.VariableAssignment())) {
            return expr;
        }
        this.restore(saved);
        if (this.check(expr = this.LogicalExpression())) {
            return expr;
        }
        this.restore(saved);
        return null;
    }

    IfExpression() {
        let saved = this.cursor;
        let condition, consequence, alternative;

        if (this.Terminal('if', 'reserved') &&
            this.check(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.check(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT') &&
            this.Terminal('else', 'reserved') &&
            this.check(alternative = this.IfExpression())
        ) {
            return ['if', condition, consequence, alternative];
        }

        this.restore(saved);

        if (this.Terminal('if', 'reserved') &&
            this.check(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.check(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT') &&
            this.Terminal('else', 'reserved') &&
            this.check(alternative = this.WhileExpression())
        ) {
            return ['if', condition, consequence, alternative];
        }

        this.restore(saved);

        if (this.Terminal('if', 'reserved') &&
            this.check(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.check(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT') &&
            this.Terminal('else', 'reserved') &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.check(alternative = this.StatementList()) &&
            this.Terminal('', 'DEDENT')
        ) {
            return ['if', condition, consequence, alternative];
        }

        this.restore(saved);
        if (this.Terminal('if', 'reserved') &&
            this.check(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.check(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT')
        ) {
            return ['if', condition, consequence];
        }
        this.restore(saved);
        return null;
    }

    WhileExpression() {
        // should have var assignment in condition ???
        let saved = this.cursor;
        let condition, consequence;
        if (this.Terminal('while', 'reserved') &&
            this.check(condition = this.LogicalExpression()) &&
            this.Terminal(':', 'punctuator') &&
            this.Terminal('', 'EOL') &&
            this.Terminal('', 'INDENT') &&
            this.check(consequence = this.StatementList()) &&
            this.Terminal('', 'DEDENT')
        ) {
            return ['while', condition, consequence];
        }
        this.restore(saved);
        return null;
    }

    VariableAssignment() {
        let saved = this.cursor;
        let name, value;

        if (this.check(name = this.Identifier()) &&
            this.Terminal('=', 'operator') &&
            this.check(value = this.Expression())
        ) {
            return ['assign', name, value];
        }
        this.restore(saved);
        return null;
    }

    // DEBATE: should there be and- and or-expressions on different levels or precedence (and.prec > or.prec) or to be let on same levels with crossing over operations from right to left
    // now, they are on the same level of precedence
    LogicalExpression() {
        let save1 = this.cursor, save2 = null,
            firstOperand, secondOperand;
        
        if (this.check(firstOperand = this.EqualityExpression())) {
            save2 = this.cursor;
            if(this.Terminal('or', 'operator') && 
               this.check(secondOperand = this.LogicalExpression())) {
                    return ['or', firstOperand, secondOperand];
            }
            this.restore(save2);
            if(this.Terminal('and', 'operator') &&
               this.check(secondOperand = this.LogicalExpression())) {
                    return ['and', firstOperand, secondOperand];
            }
            this.restore(save2);
            return firstOperand;
        }
        this.restore(save1);
        return null;
    }

    EqualityExpression() {
        let saved = this.cursor,
            firstOperand, secondOperand;
        // conteaza ca instructiunea cu clauza "is not" sa fie inaintea instructiunii cu clauza pentru "is"
        if (this.check(firstOperand = this.RelationalExpression()) &&   // special 'is not' case is here because a !== b not equiv. of a === !b
            this.Terminal('is', 'operator') &&
            this.Terminal('not', 'operator') &&
            this.check(secondOperand = this.RelationalExpression())
        ) {
            return ['is not', firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.RelationalExpression()) &&
            this.Terminal('is', 'operator') &&
            this.check(secondOperand = this.RelationalExpression())
        ) {
            return ['is', firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.RelationalExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    RelationalExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;
        if (this.check(firstOperand = this.AdditiveExpression()) &&
            this.Terminal("<", "operator") &&
            this.check(secondOperand = this.AdditiveExpression())
        ) {
            return ["<", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.AdditiveExpression()) &&
            this.Terminal(">", "operator") &&
            this.check(secondOperand = this.AdditiveExpression())
        ) {
            return [">", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.AdditiveExpression()) &&
            this.Terminal("<=", "operator") &&
            this.check(secondOperand = this.AdditiveExpression())
        ) {
            return ["<=", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.AdditiveExpression()) &&
            this.Terminal(">=", "operator") &&
            this.check(secondOperand = this.AdditiveExpression())
        ) {
            return [">=", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.AdditiveExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    AdditiveExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;
        if (this.check(firstOperand = this.MultiplicativeExpression()) &&
            this.Terminal("+", "operator") &&
            this.check(secondOperand = this.AdditiveExpression())
        ) {
            return ["+", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.MultiplicativeExpression()) &&
            this.Terminal("-", "operator") &&
            this.check(secondOperand = this.MultiplicativeExpression())
        ) {
            let lookaheadOperator = this.input[this.cursor]?.value;
            if (lookaheadOperator === "+" || lookaheadOperator === "-") {
                this.cursor++; // skip actual sign
                let thirdOperand;
                if (this.check(thirdOperand = this.AdditiveExpression()))
                    return [lookaheadOperator, ["-", firstOperand, secondOperand], thirdOperand];
            }
            return ["-", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.MultiplicativeExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    MultiplicativeExpression() {
        let saved = this.cursor;
        let firstOperand,
            secondOperand;
        if (this.check(firstOperand = this.UnaryExpression()) &&
            this.Terminal("*", "operator") &&
            this.check(secondOperand = this.MultiplicativeExpression())
        ) {
            return ["*", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.UnaryExpression()) &&
            this.Terminal("/", "operator") &&
            this.check(secondOperand = this.UnaryExpression())
        ) {
            let lookaheadOperator = this.input[this.cursor]?.value;
            if (lookaheadOperator === "*" || lookaheadOperator === "/") {
                this.cursor++; // skip actual sign
                let thirdOperand;
                if (this.check(thirdOperand = this.MultiplicativeExpression()))
                    return [lookaheadOperator, ["/", firstOperand, secondOperand], thirdOperand];
            }
            return ["/", firstOperand, secondOperand];
        }
        this.restore(saved);
        if (this.check(firstOperand = this.UnaryExpression())) {
            return firstOperand;
        }
        this.restore(saved);
        return null;
    }

    UnaryExpression() {
        let saved = this.cursor;
        let expr;
        if (this.Terminal("+", "operator") &&
            this.check(expr = this.PrimaryExpression())
        ) {
            return ["+", expr];
        }
        this.restore(saved);
        if (this.Terminal("-", "operator") &&
            this.check(expr = this.PrimaryExpression())
        ) {
            return ["-", expr];
        }
        this.restore(saved);
        if (this.Terminal("not", "operator") &&
            this.check(expr = this.PrimaryExpression())
        ) {
            return ["not", expr];
        }
        this.restore(saved);
        if (this.check(expr = this.PrimaryExpression())) {
            return expr;
        }
        this.restore(saved);
        return null;
    }

    PrimaryExpression() {
        let saved = this.cursor;
        let expr;
        if (this.Terminal("(", "operator") &&
            this.check(expr = this.VariableAssignment()) && // for VarAssign => if 5 is (a = half(10)): # now u can use "a" as func result in AND after the if statement, DEBATE: is this syntax useful / replaceable / necesarry ? see walrus operator
            this.Terminal(")", "operator")
        ) {
            return expr;
        }
        this.restore(saved);
        if (this.Terminal("(", "operator") &&
            this.check(expr = this.LogicalExpression()) && // for LogicalExpr if true and (false or 2 <= 3): # mandatory delimiting between or and and-expressions (not same (logical \ relational) expressions)
            this.Terminal(")", "operator")
        ) {
            return expr;
        }
        this.restore(saved);
        if (this.check(expr = this.FunctionCall())) {
            return expr;
        }
        this.restore(saved);
        if (this.check(expr = this.Literal())) {
            return expr;
        }
        this.restore(saved);
        if (this.check(expr = this.Identifier())) {
            return expr;
        }
        this.restore(saved);
        return null;
    }

    FunctionCall() { // TODO: FIXME: calls as arguments to other calls make program veeeeeeeery slow
                     // Also normal calls using ( ... ) (parantheses with an expression) are taking veeeeery long time to exec 
        let saved = this.cursor;
        let name, next, args = [];
        if (this.check(name = this.Identifier()) &&
            this.Terminal("(", "operator")
        ) {
            if(this.Terminal(")", "operator")) {
                return [name];
            }
            if(this.check(next = this.LogicalExpression())) {
                args.push(next);
                while(true) {
                    if(this.Terminal(",", "operator")) {
                        if(this.check(next = this.LogicalExpression())) {
                            args.push(next);
                        } else return null;
                    } else break;
                }
                if(this.Terminal(")", "operator")) {
                    args.unshift(name);
                    return args;
                }
            }
        }
        this.restore(saved);
        return null;
        
        // TODO: FUTUREPLAN: DEBATE: add and allow ONLY named parameters => arguments will look like assignments: purchase(account = myAcc, money = 499.99, currency = "EUR")
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
        if (this.input[this.cursor]?.kind === "reserved" &&
            ["true", "false", "nothing"].includes(this.input[this.cursor]?.value)
        ) {
            return this.input[this.cursor++].value;
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
    
    /**
     * @param {String} value - the actual content of the terminal
     * @param {String} kind  - the kind of the terminal, according to the Neutrino rules 
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
        return false; // should here be "null" instead?
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

        if ((expr = this.VariableDeclaration()) !== false) {
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

        if ((expr = this.IfExpression()) !== false)
            return expr;

        this.restore(saved);

        if ((expr = this.WhileExpression()) !== false)
            return expr;

        this.restore(saved);

        if ((expr = this.VariableAssignment()) !== false)
            return expr;

        this.restore(saved);

        if ((expr = this.BooleanExpression()) !== false)    //
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

    VariableDeclaration() {
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
            (condition = this.BooleanExpression()) !== false &&
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

    IfExpression() {
        let saved = this.cursor;
        let condition, consequence, alternative;

        if (this.Terminal('if', 'reserved') !== false &&
            (condition = this.BooleanExpression()) !== false &&
            this.Terminal(':', 'punctuator') !== false &&
            this.Terminal('', 'EOL') !== false &&
            this.Terminal('', 'INDENT') !== false &&
            (consequence = this.StatementList()) !== false &&
            this.Terminal('', 'DEDENT') !== false &&
            this.Terminal('else', 'reserved') !== false &&
            (alternative = this.IfExpression()) !== false) {
            return ['if', condition, consequence, alternative];
        }

        this.restore(saved);

        if (this.Terminal('if', 'reserved') !== false &&
            (condition = this.BooleanExpression()) !== false &&
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
            (condition = this.BooleanExpression()) !== false &&
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
            (condition = this.BooleanExpression()) !== false &&
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

    // TODO: FIXME: DEBATE: boolean should be higher or equal on level to additive <===> should be separate branches in expression rule instead of parent-child branches?
    // TODO: FIXME: commentariul pe o linie terminala a programului (pe ultima) da erori in parsing => posibil problema in tokenizing, de aflat
    BooleanExpression() {
        // TODO: de vazut daca boolean expression poate ramane pe acelasi nivel cu addition sau trebuie sa fie ierarhizate
        // pe moment, singurul timp in care se intra pe if este daca conditia nu are valoarea "false" (nu se face in interior NICIO CONVERSIE DE TIP FALSY ex. 0 catre false)
        let saved = this.cursor;
        let firstOperand,
            secondOperand;

        // de studiat f bine precedenta intre operatorii && si || +
        // vrem sa dam eroare de compilare daca nu se separa accordingly? ACUM NU OFERA, dar poate fi schimbat, in prezenta clauzelor de lookahead
        // ^^^^^^^^^^^^^^^^^^^^^ https://docs.microsoft.com/en-us/cpp/c-language/precedence-and-order-of-evaluation?view=msvc-160#:~:text=The%20logical%2DAND%20operator%20(%20%26%26,is%20evaluated%20before%20s%2D%2D%20.

        if ((firstOperand = this.EqualityExpression()) !== false &&
            this.Terminal('or', 'operator') !== false &&
            (secondOperand = this.BooleanExpression()) !== false) {
            // if (Array.isArray(secondOperand) && secondOperand[0] === "and") {
            //     ErrorHandler.SyntaxError(`AND and OR-expressions undelimited accordingly`); // <= facem ca && si || sa aiba acelasi precedence si sa trebuiasca obligatoriu separati prin paranteze daca se folosesc impreuna unul langa celalalt
            // }
            return ['or', firstOperand, secondOperand];
        }

        this.restore(saved);

        if ((firstOperand = this.EqualityExpression()) !== false &&
            this.Terminal('and', 'operator') !== false &&
            (secondOperand = this.BooleanExpression()) !== false) {
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
            (firstOperand = this.BooleanLiteral()) !== false) { // => daca era BoolExpr: ! a > 5 era = cu !(a > 5)
            return ['not', firstOperand];                           // => daca era AddExpr: !a + 1 era = cu true + 1 sau false + 1, dupa caz ===> eroare de compilare
        }                                                           // TODO: DEBATE: cum incadram operatorul not (se poate incadra la op relationali?) + ar trebui mutat altundeva sau sa detina sectiune proprie (poate cu unary plus si minus???), de vazut

        this.restore(saved);

        if ((firstOperand = this.BooleanLiteral()) !== false) { // should there be no "nothing" statement involved????, check case "if nothing: ..."
            return firstOperand;
        }

        this.restore(saved);

        return false;
    }

    BooleanLiteral() {

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
            ((expr = this.BooleanExpression()) !== false) && // !== Expression bcz we might have the following JS-invalid code: 2 + ( if a is 0: ...if-expr... )
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
         * @param {String} kind  - the kind of the terminal, according to the Neutrino rules 
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