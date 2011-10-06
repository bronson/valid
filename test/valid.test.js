// valid.test.js
//
// Tests non-JSON validations that return string errors.

var Valid = require('../lib/valid');


// throws an error if the result doesn't exactly match the expectation
Valid.assert = function assert(value, expected) {
    var actual = this.check(value);
    if(expected !== actual) {
        var exstr = (expected === undefined ? "success" : "'" + expected + "'");
        var acstr = (actual === undefined ? "success" : "'" + actual + "'");
        throw Error(value + ": expected " + exstr + " but got " + acstr);
    }
};


// first test the validation routines
if(Valid.equal(4).check(4) !== undefined)       throw Error("test() success must return undefined");
if(Valid.equal(4).check(5) !== "must equal 4")  throw Error("test() failure must return the right string");
if(Valid.equal(4).isValid(4) !== true)          throw Error("check() success must return true");
if(Valid.equal(4).isValid(5) !== false)         throw Error("check() failure must return false");

Valid.assert("any value", "no validations!");

// utilities
Valid.nop().assert("any value");
Valid.fail().assert("anything", "failed");
Valid.fail("die!").assert("anything", "die!");
Valid.todo().assert("wut", "validation is still todo");
Valid.todo("release 1.0").assert(12, 'release 1.0 is still todo');
Valid.equal(12).message("must be twelve").assert(12)
Valid.equal(12).message("must be twelve").assert(13, "must be twelve")
Valid.equal(12).message("first").message("last").assert(13, "last");
Valid.equal(12).message("first").message("middle").message("last").assert(13, "last");
Valid.message("bla").assert(12, "no validations!");

// undefined
Valid['undefined']().assert(undefined);
Valid['undefined']().assert(1, "must be undefined");
Valid['undefined']().assert(null, "must be undefined");
Valid.undef().assert(undefined);
Valid.undef().assert(1, "must be undefined");
Valid.undef().assert(null, "must be undefined");
Valid.defined().assert(undefined, "can't be undefined");
Valid.defined().assert(1);
Valid.defined().assert(null);

// null
Valid['null']().assert(null);
Valid['null']().assert(1, "must be null");
Valid['null']().assert(undefined, "must be null");
Valid.nil().assert(null);
Valid.nil().assert(1, "must be null");
Valid.nil().assert(undefined, "must be null");
Valid.notNull().assert(null, "can't be null");
Valid.notNull().assert(1);
Valid.notNull().assert(undefined);

// exists
Valid.exists().assert(0);
Valid.exists().assert(false);
Valid.exists().assert(null, "must exist");
Valid.exists().assert(undefined, "must exist");
// don't test Valid.noexisty(), the name is an embarrassment

// equality
Valid.equal().assert(undefined, "equal needs at least one argument");
Valid.equal(null).assert(null);
Valid.equal(null).assert(undefined, "must equal null");
Valid.equal("a").assert("a");
Valid.equal("a").assert(" ", "must equal 'a'");
Valid.equal(12).assert(12);
Valid.equal(12).assert(13, "must equal 12");
Valid.notEqual(null).assert(undefined);
Valid.notEqual(null).assert(null, "can't equal null");
Valid.notEqual("a").assert(" ");
Valid.notEqual("a").assert("a", "can't equal 'a'");
Valid.notEqual(12).assert(13);
Valid.notEqual(12).assert(12, "can't equal 12");
Valid.equal(undefined, null).assert(null);
Valid.equal(1,2,3,4,5).assert(4);
Valid.equal(1,2,3,4,5).assert(6, "must be 1, 2, 3, 4 or 5");
Valid.equal("able","baker").assert(undefined, "must be 'able' or 'baker'");

Valid.oneOf().assert(undefined, "oneOf needs a collection");
Valid.oneOf([1,2,3,4,5]).assert(4);
Valid.oneOf({a:1,b:2,c:3}).assert('c');
Valid.oneOf({a:1,b:2,c:3}).assert(2, "is not an option");

// typeof
Valid.type('undefined').assert(undefined);
// typeof null returns 'object' on some JS implementations, use null()
Valid.type('number').assert(123);
Valid.type('string').assert('123');
Valid.type('garbage').assert('123', "must be of type garbage not string");
Valid.type(undefined).assert(undefined, "type requires a string argument, not undefined");
Valid.type(123).assert(123, "type requires a string argument, not number");

// booleans
Valid.boolean().assert(true);
Valid.boolean().assert(false);
Valid.boolean().assert(undefined, "must be a boolean");
Valid.isTrue().assert(true);
Valid.isTrue().assert(false, "must be true");
Valid.isFalse().assert(false);
Valid.isFalse().assert(true, "must be false");
Valid['true']().assert(true);
Valid['true']().assert(false, "must be true");
Valid['false']().assert(false);
Valid['false']().assert(true, "must be false");

// numbers
Valid.number().assert(123);
Valid.number().assert('123', "must be a number");
Valid.number().assert(undefined, "must be a number");
Valid.integer().assert(123.0);
Valid.integer().assert('123.0', "must be an integer");
Valid.integer().assert(123.1, "must be an integer");
Valid.even().assert(0);
Valid.even().assert(12);
Valid.even().assert(17, "must be even");
Valid.even().assert(0);
Valid.odd().assert(1);
Valid.odd().assert(17);
Valid.odd().assert(12, "must be odd");
Valid.odd().assert(0, "must be odd");

// strings
Valid.string().assert(' 123');
Valid.string().assert(undefined, "must be a string");
Valid.blank().assert(' ');
Valid.blank().assert(' \n\t  ');
Valid.blank().assert('');
Valid.blank().assert(null);
Valid.blank().assert(undefined);
Valid.blank().assert('    .', "must be blank");
Valid.notBlank().assert('   bla');
Valid.notBlank().assert('\n', "can't be blank");
Valid.notBlank().assert('', "can't be blank");
Valid.notBlank().assert(null, "can't be blank");
Valid.notBlank().assert(undefined, "can't be blank");
Valid.len(6).assert('abcdef');
Valid.len(2,4).assert('()()');
Valid.len(0).assert('');
Valid.len(0).assert(Array(900).join(".-'-."));
Valid.len(0,0).assert('');
Valid.len(1).assert('', 'is too short (minimum is 1 character)');
Valid.len(1,4).assert(' . . . . ', 'is too long (maximum is 4 characters)');
Valid.len(2,4).assert(undefined, "must have a length field");
Valid.len(2,4).assert(3, "must have a length field");
Valid.empty().assert('');
Valid.empty().assert(' ', 'must be empty');

// regexes
Valid.match(/^.*$/).assert('');
Valid.match(/^abc$/).assert('abc');
Valid.match(/^abc$/).assert('abcd', "must match /^abc$/");
Valid.match(/^abc$/).assert(undefined, "must be a string");
Valid.match(/1/).assert(1, "must be a string");
Valid.match(/ABC/).assert('abcdef', "must match /ABC/");
Valid.match(/ABC/i).assert('noodabc ');
Valid.match('ABC', 'i').assert('noodabc ');
Valid.nomatch(/.../).assert('--');
Valid.nomatch('wut', 'i').assert('WUT', "can't match /wut/i");
Valid.nomatch(/^\s*|\s*$/, 'i').assert('doh ', "can't match /^\\s*|\\s*$/");

// arrays
Valid.array().empty().assert([]);
Valid.array().empty().assert(null, "must be an array");
Valid.array().empty().assert([undefined], "must be empty");
Valid.len(0).assert([]);
Valid.len(0,0).assert([]);
Valid.len(0,0).assert([undefined], "is too long (maximum is 0 elements)");
Valid.len(6,9).assert([0,1,2,3,4,5]);
Valid.array(Valid.integer()).assert([0,1,2]);
Valid.array(Valid.defined().integer()).assert([0,null,2], "item 1 must be an integer");
Valid.array(Valid.defined().string().match(/cow/)).assert(['cow','cowtown','vacaville'], "item 2 must match /cow/");

// logic
Valid.and().assert(null);                         // passing 0 tests succeeds unconditionally
Valid.and( Valid.nil() ).assert(null);                            // passing 1 arg success
Valid.and( Valid.nil() ).assert(undefined, "must be null"); // passing 1 arg failure
Valid.and( Valid.string(), Valid.match(/c$/), Valid.match(/^a/) ).assert('abc');
Valid.and( Valid.string(), Valid.match(/^bbc$/) ).assert('abc', "must match /^bbc$/");
Valid.and( Valid.number(), Valid.match(/^abc$/) ).assert('abc', "must be a number");
Valid.or().assert(undefined);                     // passing 0 tests succeeds unconditionally
Valid.or( Valid.nil() ).assert(null);                            // passing 1 arg success
Valid.or( Valid.nil() ).assert(undefined, "must be null"); // passing 1 arg failure
Valid.or( Valid.nil(), Valid.undef() ).assert(undefined);
Valid.or( Valid.nil(), Valid.undef() ).assert(null);
Valid.or( Valid.nil(), Valid.number(), Valid.string() ).assert('mosdef');
Valid.or( Valid.undef(), Valid.match(/^abc$/), Valid.match(/def$/) ).assert('mosdef');
Valid.or( Valid.number(), Valid.match(/^bbc$/) ).assert('abc', "must be a number or must match /^bbc$/");
Valid.not( Valid.nil() ).assert(null, "validation must fail");
Valid.not( Valid.nil() ).assert(undefined);
Valid.not( Valid.equal(4), "equalled four" ).assert(4, "equalled four");

// relational
Valid.ne(4).assert(1);
Valid.lt(4).assert(2);
Valid.le(4).assert(3);
Valid.le(4).assert(4);
Valid.eq(4).assert(4);
Valid.ge(4).assert(4);
Valid.ge(4).assert(5);
Valid.gt(4).assert(6);
Valid.eq(4).assert(1, "must equal 4");
Valid.ge(4).assert(2, "must be greater than or equal to 4");
Valid.gt(4).assert(3, "must be greater than 4");
Valid.gt(4).assert(4, "must be greater than 4");
Valid.ne(4).assert(4, "can't equal 4");
Valid.lt(4).assert(4, "must be less than 4");
Valid.lt(4).assert(5, "must be less than 4");
Valid.le(4).assert(6, "must be less than or equal to 4");
Valid.ne('yyz').assert('Yyz');
Valid.lt('yyz').assert('xyza');
Valid.le('yyz').assert('xyz');
Valid.le('yyz').assert('yyz');
Valid.eq('yyz').assert('yyz');
Valid.ge('yyz').assert('yyza');
Valid.ge('yyz').assert('yyz');
Valid.gt('yyz').assert('yyzz');
Valid.eq('yyz').assert('Yyz',  "must equal 'yyz'");
Valid.ge('yyz').assert('xyza', "must be greater than or equal to 'yyz'");
Valid.gt('yyz').assert('xyz',  "must be greater than 'yyz'");
Valid.gt('yyz').assert('yyz',  "must be greater than 'yyz'");
Valid.ne('yyz').assert('yyz',  "can't equal 'yyz'");
Valid.lt('yyz').assert('yyza', "must be less than 'yyz'");
Valid.lt('yyz').assert('yyz',  "must be less than 'yyz'");
Valid.le('yyz').assert('yyzz', "must be less than or equal to 'yyz'");

// optional
Valid.optional().assert(undefined);   // an optional with no tests is equivalent to nop()
Valid.optional().integer().assert(undefined);
Valid.optional().integer().assert(null);
Valid.optional().integer().assert(12);
Valid.optional().integer().assert("12", "must be an integer");

// static
var nullOrString = Valid.or(Valid.nil(), Valid.string());
nullOrString.assert(null);
nullOrString.assert('123');
nullOrString.assert(123, "must be null or must be a string");



// closure leak meant only one test would be queued, not all three
Valid.equal(3).assert(Valid.undef().nil().number()._queue.length );
// closure leak meant all matches were appended to the same Chain
Valid.equal(2).assert( Valid.match(/^abc$/)._queue.length );

