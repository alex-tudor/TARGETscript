/*************************************************
 * 
 * 
 * 
 *                                          TODO List:
 * 
 * 
 * 
 * - Declarare multipla: "var a = b = c = 42" sau "var x = y = z = w" (ultimul va fi assign pentru toate celelalte) 
 * - bucla for
 * - operatorul .. sau ... , care va intoarce un array / iterator cu numerele dintre primul operand si al doilea inclusiv operanzii
 * - declararea unei functii (cu func sau cu arrow syntax, vezi generator pt detalii)
 *      - ok ar fi ca functiile sa NU fie cum sunt acum in generator, CI mai degraba sa fie ca in Python, cu atribuirea numelui in scrierea parametrilor (parametri numiti, pot fi default sau optionali, se merge pe principiul dereferentierii cu obiect din JS: function f({a, b, c} = {}) { ... })
 * - comunitati 
 *      - adauga la creare func constructor, func destructor () (vezi finalization registry in JS pe MDN), 'my' si 'me' (membrul this, vezi functie in functie si 'this' kw shadowing)
 * - entitati
 *      - o entitate poate apartine acum unei clase / mai multe, iar mai apoi sa isi schimbe clasa de provenienta in altcineva = sa "paraseasca" clasa respectiva si sa se afilieze alteia /altora asemanatoare / diferite cu prima / primele
 * - dereferentiere (sintaxa (cu "." probabil + gaseste alt nume mai scurt)
 * 
 * - e posibil sa implementam ceva care sa aiba sens in folosire, asemanator cu send() din Apple.nio?
 * 
 * - repara / decide te asupra functionalitatilor cu caracter temporar (marcate in comentarii cu "DEBATE:")
 *
 *************************************************
 */





compile = code => {
    const tokenizer = new Tokenizer(), parser = new Parser(), generator = new Generator();
    console.log(generator.eval(parser.parse(tokenizer.tokenize(code))));
}

function Tokenize() {
    var code = document.getElementById("code").value;
    const tokenizer = new Tokenizer();
    var tokenizedCode = tokenizer.tokenize(code);
    document.getElementById("output").innerHTML = JSON.stringify(tokenizedCode);
}

function Parse() {
    var code = document.getElementById("code").value;
    const tokenizer = new Tokenizer(),
        parser = new Parser();
    var tokenizedCode = tokenizer.tokenize(code);
    var parsedCode = parser.parse(tokenizedCode);
    document.getElementById("output").innerHTML = JSON.stringify(parsedCode);
}

function Run() {
    var code = document.getElementById("code").value;
    const tokenizer = new Tokenizer(),
        parser = new Parser(),
        generator = new Generator();
    var tokenizedCode = tokenizer.tokenize(code);
    var parsedCode = parser.parse(tokenizedCode);
    var generatedCode = generator.eval(parsedCode);
    document.getElementById("output").innerHTML = generatedCode;
}

print_ = AST => {
    console.log(JSON.stringify(AST, null, 4));
}
// console.log(compile(`3 * 3 - 2 / 2 * 1;`));
// console.log(compile(`"abcd" "abcdefg"      



// `));

// compile(`
// var a = 4
//  `)



// compile(`
// var a = 0
// var b = 0

// a = b = 5 # let a = ( b = 5 ) be possible ( to be put var_assign inside primary_expr )
// a
// b
// `)

// compile(`
// var a = 0
// a = 12
// while a > 1:
//     a = a - 1
//     a # a is a + 1
// `)

// AND and OR clauses are processed from Left to Right (same thingy INSIDE the Parentheses)
// => bottom if condition = equiv. of: "(a is not 5) and (((a > 4) or (a > 1 and 1)) or 4)"
// the if-clause returns false only when condition is false (nothing !== false)
compile(`
var contor = 16

while contor is not 5:
    print(contor)
    contor = contor - 1
`)
// (new Generator()).eval(['begin', ['print', ['hey', 4], 2]]);

// compile(`
// var i = 7
// func a():


// while i is not 0:
//     print(5)
//     i = i - 1
// `)

// compile(`
// var a = b = c = 7
// `)

// compile(`
// var a = 0
// var b = 1
// var c = 2
// if nothing:
//     1
// else if b - 2 * c + 1:
//     2
// else:
//     0
// `)

// compile(`
// var hours = 0                       # [hours]    = number of hours of working
// var paycheck = 2000                 # [paycheck] = sum of money given at the end of the month
// var progress = async while true:    # or just "async while true" or use the "instant" keyword before async (omit start progress line) - instant needs async to work
//     hours += 1



//     if hours == 24:
//         hours = 0
//     wait 1000

// start progress

// while true:
//     while hours < 8:                
//         continue
//     day += 1
//     if day == 30:
//         salary += paycheck
//         print "I just got " paycheck " euros. Now i have " salary " in total"
//         day = 0
//     wait 16000                      # waits 16 hours, but progress is async and still calculates
// `)

// // console.log(tokenizer.tokenize(`
// // community Apple:
// //     var color = "red"
// //     var size = 10.234
// //     var taste = "Appleish"
// //     func constructor (color, taste):
// //         this.color = color
// //         this.taste = taste
// //         [this.color, this.taste]

// //     func destructor ():
// //         print "Object is destroyed"
// // `))





// // const generator = new Generator();
// // tokenizer.tokenize(`
// //     if a + 1 is 0:
// //         print "ab\\\\cd"
// //     else:
// //         print 5 + 2
// // `);

// // tokenizer.tokenize(`
// //     if a + 1 is 0:
// //         print "ab\\"cd"
// //     else:
//         print 5 + 2
// `);

// tokenizer.tokenize(`
//     if a + 1 is 0:
//         print "ab\\~cd"
//     else:
//         print 5 + 2
// `);













// nio.eval([
// "begin",
// ['if', ['is', 3, 2], ['print', '\"Yes\"'], ['print', '\"No\"']],
// ['func', 'calc', ['x', 'y'], ['*', 'x', 'y']],
// ['print', ['calc', 10, 20]], // 200
// ['print', ['/', 30, 20]], // 1.5
// ['print', ['not', 'false']], // true
// ["var", "a", 10],
// ["var", "b", 24],
// ["var", "i", 12],
// ["while", [">", "i", 0], ["begin", ["print", "i"], ["set", "i", ["-", "i", 1]]]],
// ["print", "\"now, i =\"", "i"],
// ["for", ["var", "j", 0], ["<", "j", 7], ["set", "j", ["+", "j", 1]], ["print", "j"]],
// ["print", "\"now, j =\"", "j"],
// ["print", [["arrow", ["x", "y"], ["*", "x", "y"]], 7, 2]],
// ["community", "MyComm", "null", [
// 'begin',
// ['var', 'z', 40],
// ['func', 'constructor', ['me', 'obj'], [
// 'begin',
// ['var', 'my', 'me'], // transfer of 'this' variable's attributes to a secondary variable
// ['set', ['prop', 'my', 'obj'], 'obj']
// ]],
// ['func', 'printCoords', ['me', 'x', 'y'], [
// 'begin',
// ['print', '\"X:\"', 'x', '\", Y:\"', 'y'] // X: <x>, Y: <y>
// ]]
// ]],
// ["var", "ent", ["entity", "MyComm", ['a']]],
// ["var", "ent2", ["entity", "MyComm", ['b']]],
// ['print', ['prop', 'ent', 'obj'], ['prop', 'ent', 'z']], /* 10 40 */
// ['set', ['prop', 'ent', 'z'], 14],
// ['print', ['prop', 'ent', 'obj'], ['prop', 'ent', 'z']], /* 10 14 */
// ['print', ['prop', 'ent2', 'obj'], ['prop', 'ent2', 'z']], /* 24 40 */
// [['prop', 'ent', 'printCoords'], 'ent', 30, 50], // X: 30, Y: 50
// ['error', '\"Your code works perfectly\"', '\"No other messages given!\"']
// ])