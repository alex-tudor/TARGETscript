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
 * - dereferentiere sintaxa (cu "." probabil + gaseste alt nume mai scurt)
 * 
 * - e posibil sa implementam ceva care sa aiba send in folosire (send statement ca si cum ar fi return) 
 * - file reader dintr-un 'terminal' diferit de pe site (un div cu contenteditable selectiv), cu instructiunea "read" in interiorul limbajului Target
 * - repara / decide te asupra functionalitatilor cu caracter temporar (marcate in comentarii cu "DEBATE:")
 * - instructiunea 'use <file_name>'
 *     - obligatoriu va fi fisier '.tg' valid (pt alte fisiere vom avea o comunitate ex. File cu reader si writer streams incorporate si diferite pt fiecare fisier, pt ca e posibil sa existe concurrency)
 *************************************************
 */

// Tokenize = code => new Tokenizer().tokenize(code);
// Parse    = code => new Parser().parse(new Tokenizer().tokenize(code));

compile = code => new Generator().generate(new Parser().parse(new Tokenizer().tokenize(code)));

const start = performance.now();

process = filename => typeof filename === "string"
    ? fetch(filename).then(response => response.text())
        .then(compile)
        .catch(console.warn)
        .finally(() => (console.log(`Program performance: ${performance.now() - start}ms.`, null)))
    : `Filename given is not a string.`;

    for(let i = 1; i <= 1; i++) {
        process(`./TargetFiles/test-file-${i}.tg`);
    }
// community / group Apples:
    // var color = "red"
    // var size = 10.234
    // var taste = "Appleish"
    // func constructor (color, taste):
    //     this.color = color
    //     this.taste = taste
    //     [this.color, this.taste]

    // func destructor ():
    //     print "Object is destroyed"
    // `))





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