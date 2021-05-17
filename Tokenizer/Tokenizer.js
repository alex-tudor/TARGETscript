class Tokenizer {
    /*
    TODO:
    make support for : and tabs for instruction depth levels
    no ; or { } ever needed
    : needed after if expression condition (like Py, if a is 0: ... and tabs)
    get instructions after tabbing level (more research to be done)

    REPAIR: because of sanitize problem, first line of input can have any indentation
    REPAIR: problems appear when using newline after comments found in the first rows of program, make tokenizer delete that newlines before processing
    REPAIR: tokenizer accepts 00000123 as a number, but not 0001.234 as a number (there is a problem with the isNum regex that is currently used)
    REPAIR: 'func' ___ is not a function or something related happens because there is a full white line inside the function declaration (Tokenizer has to fix that) 
    */
    tokenize(input) {
        if(typeof input !== "string")
            ErrorHandler.InternalError("Input given to the Tokenizer is not of type 'string'.");

        // REPAIR:
        input = input.trimEnd(); // trim input to delete EOLs / spaces before or after input
        input = input.replace(/\n(\s*\n)+/g, '\n'); // delete multiple succeeding EOLs
        input = input.replace(/\r\n/g, '\n'); // in the Target files edited using a Windows environment, newline is marked internally using '\r\n' (on Linux / Mac, only '\n' is used), 
        input = input.replace(/( )+\n/g, '\n'); // delete trailing spaces before EOL
        if(input !== "") // if file is not empty by now
            input = input + '\n'; /*
            ^^^^^^^^
            Folosim instr de mai sus pt ca:
            Exista cazuri in care structuri precum IF se incheie in cod cu EOF si 
            intre cele doua se pune un DEDENT care blocheaza accesul la EOF.
            De aceea, punem un EOL de la noi pentru a putea fi incadrat in IF
            
            sau

            cazul in care ultimul statement se va incheia cu EOF, nu cu EOL
            -   cu toate acestea, programul ar trebui sa fie valid
        */
        console.log(input);
        this.reservedWords = ['if', 'else', 'while', 'var', 'func', /*'this'*/, 'print', 'error', 'true', 'false', 'nothing', 'type', 'of'];
        let opList = ['+', '-', '*', '/', '=', '<=', '>=', '<', '>', 'is', 'and', 'or', 'not', '(', ')', ',', '.'];
        const cursor = {
            pos: 0,
            line: 1,
            column: 0,
            depth: 0,
            get char() {
                return input.charAt(this.pos);
            },
            hasNext(regex) {
                return regex.test(input.charAt(this.pos + 1));
            },
            get atEOF() {
                return /^$/.test(this.char);
            },
            get atEOL() {
                return /^\n$/.test(this.char);
            },
            get atWhiteSpace() {
                return /^ $/.test(this.char);
            },
            get atTab() {
                return /^ $/.test(this.char) &&
                    /^ $/.test(input.charAt(this.pos + 1)) &&
                    /^ $/.test(input.charAt(this.pos + 2)) &&
                    /^ $/.test(input.charAt(this.pos + 3));
            },
            get atEscape() {
                return /^\\$/.test(this.char);
            },
            get atCommentStart() {
                return /^#$/.test(this.char);
            },
            get atNumStart() {
                return /^[0-9]$/.test(this.char);
            },
            get atStrStart() {
                return /^"$/.test(this.char);
            },
            get atOp() { // not at op start
                let op = opList.find(el => el === input.substring(this.pos, this.pos + el.length));
                return op !== undefined && input.substring(this.pos, this.pos + 7) !== "nothing"; // rule for excluding "not" from operator category if it is just part of "nothing" word
            },
            get atIdentStart() {
                return /^[A-Za-z_`]$/.test(this.char);
            },
            get atPunctStart() {
                return /^(\:|\[|\]|\^)$/.test(this.char);
            },
            advance() {
                if (!this.atEOL) this.column++;
                else {
                    this.line++;
                    this.column = 0;
                }
                this.pos++;
            }
        }, API = {
            output: [],
            isNum(token) {
                return /^(0|[1-9][0-9]*)\.?[0-9]*$/.test(token);
            },
            isStr(token) {
                return /^"[^"]*"$/.test(token);
            },
            getOp() {
                let op = opList.find(el => el === input.substring(cursor.pos, cursor.pos + el.length)) ?? "",
                    len = op.length;
                this.skipWhile(() => len-- > 0);
                return op;
            },
            isIdentifier(token) {
                return /^[A-Za-z_][A-Za-z0-9_]*$/.test(token);
            },
            isPunct(token) {
                return /^(\:|\,|\[|\])$/.test(token);
            },
            skipWhile(condition) {
                while (condition()) cursor.advance();
            },
            store(token) {
                this.output.push(token);
            }
        };

        while (!cursor.atEOF) {
            if (cursor.atEOL) {
                API.store({ value: "", kind: "EOL", line: cursor.line, column: cursor.column });
                cursor.advance(); // \n+
                while (cursor.atEOL) {
                    cursor.advance();
                }
                if (!cursor.atTab) {  // \n+(?!(\s{4})+)
                    while (cursor.depth) {
                        API.store({ value: "", kind: "DEDENT", line: cursor.line, column: cursor.column });
                        cursor.depth--;
                    }
                    continue;
                }

                let tabs = 0; // \n+(?=(\s{4})+)
                while (cursor.atTab) {
                    tabs++;
                    cursor.advance();
                    cursor.advance();
                    cursor.advance();
                    cursor.advance();
                }
                if (tabs === cursor.depth) continue;

                if (tabs > cursor.depth + 1) ErrorHandler.SyntaxError(`Too many tab characters - (${cursor.line}:${cursor.column})`);

                if (tabs === cursor.depth + 1) {
                    API.store({ value: "", kind: "INDENT", line: cursor.line, column: cursor.column });
                    cursor.depth++;
                    continue;
                }

                while (cursor.depth - tabs > 0) {
                    cursor.depth--;
                    API.store({ value: "", kind: "DEDENT", line: cursor.line, column: cursor.column });
                }
                continue;

            }

            if (cursor.atWhiteSpace) {
                API.skipWhile(() => cursor.atWhiteSpace);
                continue;
            }    

            if (cursor.atCommentStart) {
                API.skipWhile(() => !cursor.atEOL && !cursor.atEOF);
                if(cursor.atEOL) cursor.advance();
                continue;
            }

            if (cursor.atNumStart) {
                /* accepted numbers:
                    1234
                    123.456
                    .1234
                    1234.            

                    not accepted numbers:
                    .
                    ..
                    123..456
                */
                let token = ``;
                let dot = false;
                while (true) {
                    if (cursor.atEOF || !API.isNum(token + cursor.char)) break;

                    if (cursor.char === `.`) {
                        if(dot) {
                            ErrorHandler.SyntaxError(`Too many dots in your number`);
                        }
                        dot = true;
                    }
                    token += cursor.char;
                    cursor.advance();
                }
                API.store({ value: token, kind: "number", line: cursor.line, column: cursor.column });
                continue;
            }

            if (cursor.atStrStart) {
                // only \ or " can ever be escaped in a string
                let token = ``,
                    closed = false,
                    isEscaped = false;
                    token += "\"";
                    cursor.advance();
                while (!closed) {
                    if (cursor.atEOF) ErrorHandler.SyntaxError(`Delimiter \" missing at the end of string - (${this.line}:${this.column})`);

                    // cursor.prev === '\\', cursor.char === `\\` or `"`
                    if (isEscaped) {
                        if (![`\\`, `"`].includes(cursor.char)) ErrorHandler.SyntaxError(`Expected { \\\\ | \\" } as escape syntax - Found \\${cursor.char}`)
                        isEscaped = false;
                        token += cursor.char;
                        cursor.advance();
                        continue;
                    }

                    // cursor.char === `\\`
                    if (cursor.atEscape) {
                        isEscaped = true;
                        cursor.advance();
                        // here should be added a switch for characters like \n, \t, special characters (\xxxx, without that 'u' in front, x = hex digit) etc.
                        // it should also contain token += cursor.char & cursor.advance()
                        continue;
                    }

                    if (cursor.char === `"`) { // already covered opened string or escaped quote cases
                        closed = true;
                        token += cursor.char;
                        cursor.advance();
                        continue;
                    }

                    token += cursor.char;
                    cursor.advance();
                }
                API.store({ value: token, kind: "string", line: cursor.line, column: cursor.column });
                continue;
            }

            if (cursor.atPunctStart) {
                let token = ``;
                while (true) {
                    if (cursor.atEOF || !API.isPunct(token + cursor.char)) break;
                    token += cursor.char;
                    cursor.advance();
                }
                API.store({ value: token, kind: "punctuator", line: cursor.line, column: cursor.column });
                continue;
            }

            if (cursor.atOp) {
                // TODO: to be rebuilt & watched closely on adding new operands into language (can be prone to errors for some types of operands)
                // has to be rebuilt to accept "is" and "not" as operators (repectively, === and !).
                // also, "is not" as a !== should also keep its logical sense after parsing expr1 === !(expr2)
                /*
                var e1 = [true, false, true, false]
                var e2 = [true, true, false, false]
                
                for(let i = 0; i < 4; i++)
                    console.log(`case ${i + 1}: ${(e1[i] !== e2[i]) === (e1[i] === !e2[i])}`);

                so, a !== b is not equiv. of a === !b (can be used without further modification, so that "is not" does not need special logical parsing rules, different from "is" and "not" as sole parsed keywords)
                which results in the fact that we only need capability of tramsforming
                "is"
                and
                "not"
                in accepted operators (before processing any identifier possibilities)

                */
                API.store({ value: API.getOp(), kind: "operator", line: cursor.line, column: cursor.column });
                continue;
            }

            if (cursor.atIdentStart) {
                let token = ``;
                if(cursor.char === "`") {
                    token += cursor.char;
                    cursor.advance();
                    let closed = false;
                    while(!closed) {
                        if (cursor.atEOF || cursor.atEOL) ErrorHandler.SyntaxError(`Delimiter \` missing at the end of spaced identifier - (${this.line}:${this.column})`);
                        
                        if (cursor.char === `\``) {
                            closed = true;
                            token += cursor.char;
                            cursor.advance();
                            continue;
                        }

                        if(!/^[A-Za-z0-9 ]$/.test(cursor.char))
                            ErrorHandler.SyntaxError(
                                `Invalid character found inside spaced identifier: ${cursor.char}. Only alphanumeric characters, spaces and underlines are accepted inside a spaced identifier.`)

                        token += cursor.char;
                        cursor.advance();

                        // DEBATE: should escaped ` (like \`) be accepted inside identifiers? for the moment, they aren't.
                    }
                    if(/^``$/.test(token)) ErrorHandler.SyntaxError(`Spaced identifiers without characters are not allowed.`)
                    
                    if(/^`\s+`$/.test(token)) ErrorHandler.SyntaxError(`Spaced identifiers that contain only spaces are not allowed.`)

                    // TODO: DEBATE: should the following happen? (to avoid 2 vs 1-spaced identifier incompatibility problem)
                    // token = token.replace(/\s+/g, ' ');

                    API.store({ value: token, kind: "identifier", line: cursor.line, column: cursor.column });
                    continue;
                }
                while (true) {
                    if (cursor.atEOF || !API.isIdentifier(token + cursor.char)) break;
                    token += cursor.char;
                    cursor.advance();
                }
                API.store({ value: token, kind: this.reservedWords.includes(token) ? "reserved" : "identifier", line: cursor.line, column: cursor.column });
                continue;
            }

            if (!cursor.atEOF) ErrorHandler.SyntaxError(`"${cursor.char}" cannot be associated to any token.`);
        }

        while (cursor.depth) {
            API.store({ value: "", kind: "DEDENT", line: cursor.line, column: cursor.column });
            cursor.depth--;
        }
        // daca se considera necesar, se poate activa linia de mai jos (va avea efect asupra clauzelor ce nu acopera in prealabil existenta acestui token in tkList)
        // API.store({ value: "", kind: "EOF", line: cursor.line, column: cursor.column });
        console.log(API.output);
        // line:column pair will still contain the EOF 'character', even if there is no such character in the file 
        return API.output;
    }
}

//         get isEOF() {
//             return this.char === '';
//         }
//         get isWhiteSpace() {
//             return this.char === ' ';
//         }
//         get isCommentStart() {
//             return this.char === '#';
//         }
//         get isNumberChar() {
//             return /[0-9\.]/.test(this.char);
//         }
//         advance() {
//             this.pos++;
//             if (this.isEOL) {
//                 this.line++;
//                 this.column = 1;
//             }
//             else this.col++;
//         }
//         store(token) {
//             this.tokenList.push(token);
//         }

//         skipWhile(condition) {
//             while (condition)
//                 this.advance();
//         }

//         this.input = input;
//         while (!this.isEOF) {

//             /**
//             * Skips whitespaces / EOLs
//             */
//             if (this.isWhiteSpace || this.isEOL) {
//                 this.skipWhile(this.isWhiteSpace || this.isEOL);
//                 continue;
//             }

//             /**
//             * Skips comments
//             */
//             if (this.isCommentStart) {
//                 this.skipWhile(!this.isEOL); // !this.prevChar.isEOL ???
//                 continue;
//             }

//             /**
//             * Captures a valid string and stores it as a token
//             */
//             if (this.char === "\"") {
//                 let string = "",
//                     isEscaped = false;
//                 while (true) {
//                     if (this.isEOF) ErrorHandler.SyntaxError(`Reached EOF while parsing string literal. (${this.line}:${this.column})`);
//                     if (this.isEOL) ErrorHandler.SyntaxError(`Reached EOL while parsing string literal. (${this.line}:${this.column})`);
//                     if (isEscaped) {
//                         string += this.char;
//                         isEscaped = false;
//                     }
//                     else if (this.char === "\\") {
//                         isEscaped = true;
//                     }
//                     else if (this.char === "\"") {
//                         string += this.char;
//                         if (string != "\"") {
//                             this.advance();
//                             break;
//                         }
//                     }
//                     else {
//                         string += this.char;
//                     }
//                     this.advance();
//                 }
//                 this.store(string);
//                 return this.tokenize();
//             }
//         }
//         return this.output;
//     }


//     return this.tokenize();
// }
// if (/[A-Za-z_]/.test(this.char)) {
//     let token = "";
//     while (true) {
//         if (!/[A-Za-z0-9_]/.test(this.char)) break;
//         token += this.char;
//         this.advance();
//     }
//     this.store(token);
//     return this.tokenize();
// }

/**
 * Captures a valid operator as a token
 */
// if (/[\+\-\*\/]/.test(this.char)) {
//     this.store(this.char);
//     this.advance();
//     return this.tokenize();
// }

/**
 * Captures a valid punctuator as a token
 */
// if (/[\:\.]/.test(this.char)) {
//     this.store(this.char);
//     this.advance();
//     return this.tokenize();
// }
// ErrorHandler.SyntaxError(`"${this.char}" cannot be associated to any token.`);
//     }
// }