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
        throw value + ": expected " + exstr + " but got " + acstr;
    }
};


// first test the validation routines
if(Valid.equal(4).check(4) !== undefined)           throw "test() success needs to return undefined";
if(Valid.equal(4).check(5) !== "is not equal to 4") throw "test() failure needs to return a string";
if(Valid.equal(4).isValid(4) !== true)               throw "check() success needs to return true";
if(Valid.equal(4).isValid(5) !== false)              throw "check() failure needs to return false";

Valid.assert("any value", "no validations!");

// utilities
Valid.nop().assert("any value");                // no-op always succeeds
Valid.fail("die!").assert("anything", "die!");  // fail always fails
Valid.todo("release 1.0").assert(12, 'release 1.0 is still todo');
Valid.equal(12).message("should be 12").assert(12)
Valid.equal(12).message("should be 12").assert(13, "should be 12")
Valid.equal(12).message("first").message("last").assert(13, "last");
Valid.message("bla").assert(12, "no validations!");

// undefined
Valid['undefined']().assert(undefined);
Valid['undefined']().assert(1, "is not equal to undefined");
Valid['undefined']().assert(null, "is not equal to undefined");
Valid.undef().assert(undefined);
Valid.undef().assert(1, "is not equal to undefined");
Valid.undef().assert(null, "is not equal to undefined");
Valid.defined().assert(undefined, "is undefined");
Valid.defined().assert(1);
Valid.defined().assert(null);

// null
Valid['null']().assert(null);
Valid['null']().assert(1, "is not equal to null");              // "is not null" would sound better
Valid['null']().assert(undefined, "is not equal to null");
Valid.nil().assert(null);
Valid.nil().assert(1, "is not equal to null");              // "is not null" would sound better
Valid.nil().assert(undefined, "is not equal to null");
Valid.notNull().assert(null, "is null");
Valid.notNull().assert(1);
Valid.notNull().assert(undefined);

// exists
Valid.exists().assert(0);
Valid.exists().assert(false);
Valid.exists().assert(null, "does not exist");
Valid.exists().assert(undefined, "does not exist");
// don't test Valid.noexisty() until the name doesn't suck

// equality
Valid.equal().assert(undefined, "equal needs at least one argument");
Valid.equal(null).assert(null);
Valid.equal(null).assert(undefined, "is not equal to null");
Valid.equal("a").assert("a");
Valid.equal("a").assert(" ", "is not equal to 'a'");
Valid.equal(12).assert(12);
Valid.equal(12).assert(13, "is not equal to 12");
Valid.notEqual(null).assert(undefined);
Valid.notEqual(null).assert(null, "is equal to null");
Valid.notEqual("a").assert(" ");
Valid.notEqual("a").assert("a", "is equal to 'a'");
Valid.notEqual(12).assert(13);
Valid.notEqual(12).assert(12, "is equal to 12");
Valid.equal(undefined, null).assert(null);
Valid.equal(1,2,3,4,5).assert(4);
Valid.equal(1,2,3,4,5).assert(6, "is not 1, 2, 3, 4 or 5");
Valid.equal("able","baker").assert(undefined, "is not 'able' or 'baker'");

Valid.oneOf().assert(undefined, "oneOf needs a collection");
Valid.oneOf([1,2,3,4,5]).assert(4);
Valid.oneOf({a:1,b:2,c:3}).assert('c');
Valid.oneOf({a:1,b:2,c:3}).assert(2, "is not one of the options");

// typeof
Valid.type('undefined').assert(undefined);
// typeof null returns 'object' on some JS implementations, use null()
Valid.type('number').assert(123);
Valid.type('string').assert('123');
Valid.type('garbage').assert('123', "is of type string not garbage");
Valid.type(undefined).assert(undefined, "type requires a string argument, not undefined");
Valid.type(123).assert(123, "type requires a string argument, not number");

// booleans
Valid.boolean().assert(true);
Valid.boolean().assert(false);
Valid.boolean().assert(undefined, "is of type undefined not boolean");
Valid.isTrue().assert(true);
Valid.isTrue().assert(false, "is not equal to true");
Valid.isFalse().assert(false);
Valid.isFalse().assert(true, "is not equal to false");
Valid['true']().assert(true);
Valid['true']().assert(false, "is not equal to true");
Valid['false']().assert(false);
Valid['false']().assert(true, "is not equal to false");

// numbers
Valid.number().assert(123);
Valid.number().assert('123', "is of type string not number");
Valid.number().assert(undefined, "is of type undefined not number");
Valid.integer().assert(123.0);
Valid.integer().assert('123.0', "is not an integer");
Valid.integer().assert(123.1, "is not an integer");
Valid.even().assert(0);
Valid.even().assert(12);
Valid.even().assert(17, "is not even");
Valid.even().assert(0);
Valid.odd().assert(1);
Valid.odd().assert(17);
Valid.odd().assert(12, "is not odd");
Valid.odd().assert(0, "is not odd");

// strings
Valid.string().assert(' 123');
Valid.string().assert(undefined, "is of type undefined not string");
Valid.blank().assert(' ');
Valid.blank().assert(' \n\t  ');
Valid.blank().assert('');
Valid.blank().assert(null);
Valid.blank().assert(undefined);
Valid.blank().assert('    .', "is not blank");
Valid.notBlank().assert('   bla');
Valid.notBlank().assert('\n', "is blank");
Valid.notBlank().assert('', "is blank");
Valid.notBlank().assert(null, "is blank");
Valid.notBlank().assert(undefined, "is blank");
Valid.len(6).assert('abcdef');
Valid.len(2,4).assert('()()');
Valid.len(0).assert('');
Valid.len(0).assert(Array(900).join(".-'-."));
Valid.len(0,0).assert('');
Valid.len(1).assert('', 'has length 0, less than 1');
Valid.len(1,4).assert(' . . . . ', 'has length 9, greater than 4');
Valid.len(2,4).assert(undefined, "doesn't have a length field");
Valid.len(2,4).assert(3, "doesn't have a length field");
Valid.empty().assert('');
Valid.empty().assert(' ', 'should be empty');

// regexes
Valid.match(/^.*$/).assert('');
Valid.match(/^abc$/).assert('abc');
Valid.match(/^abc$/).assert('abcd', "does not match /^abc$/");
Valid.match(/^abc$/).assert(undefined, "is of type undefined not string");
Valid.match(/1/).assert(1, "is of type number not string");
Valid.match(/ABC/).assert('abcdef', "does not match /ABC/");
Valid.match(/ABC/i).assert('noodabc ');
Valid.match('ABC', 'i').assert('noodabc ');
Valid.nomatch(/.../).assert('--');
Valid.nomatch('wut', 'i').assert('WUT', 'matches /wut/i');
Valid.nomatch(/^\s*|\s*$/, 'i').assert('doh ', "matches /^\\s*|\\s*$/");

// arrays
Valid.array().empty().assert([]);
Valid.array().empty().assert(null, "is not an array");
Valid.array().empty().assert([undefined], "should be empty");
Valid.len(0).assert([]);
Valid.len(0,0).assert([]);
Valid.len(0,0).assert([undefined], "has length 1, greater than 0");
Valid.len(6,9).assert([0,1,2,3,4,5]);
Valid.array(Valid.integer()).assert([0,1,2]);
Valid.array(Valid.defined().integer()).assert([0,null,2], "item 1 is not an integer");
Valid.array(Valid.defined().string().match(/cow/)).assert(['cow','cowtown','vacaville'], "item 2 does not match /cow/");

// logic
Valid.and().assert(null);                         // passing 0 tests succeeds unconditionally
Valid.and( Valid.nil() ).assert(null);                            // passing 1 arg success
Valid.and( Valid.nil() ).assert(undefined, "is not equal to null"); // passing 1 arg failure
Valid.and( Valid.type('string'), Valid.match(/c$/), Valid.match(/^a/) ).assert('abc');
Valid.and( Valid.type('string'), Valid.match(/^bbc$/) ).assert('abc', "does not match /^bbc$/");
Valid.and( Valid.type('number'), Valid.match(/^abc$/) ).assert('abc', "is of type string not number");
Valid.or().assert(undefined);                     // passing 0 tests succeeds unconditionally
Valid.or( Valid.nil() ).assert(null);                            // passing 1 arg success
Valid.or( Valid.nil() ).assert(undefined, "is not equal to null"); // passing 1 arg failure
Valid.or( Valid.nil(), Valid.undef() ).assert(undefined);
Valid.or( Valid.nil(), Valid.undef() ).assert(null);
Valid.or( Valid.nil(), Valid.number(), Valid.string() ).assert('mosdef');
Valid.or( Valid.undef(), Valid.match(/^abc$/), Valid.match(/def$/) ).assert('mosdef');
Valid.or( Valid.type('number'), Valid.match(/^bbc$/) ).assert('abc', "is of type string not number and does not match /^bbc$/");
Valid.not( Valid.nil() ).assert(null, "validation should have failed");
Valid.not( Valid.nil() ).assert(undefined);
Valid.not( Valid.equal(4), "equalled 4" ).assert(4, "equalled 4");

// relational
Valid.ne(4).assert(1);
Valid.lt(4).assert(2);
Valid.le(4).assert(3);
Valid.le(4).assert(4);
Valid.eq(4).assert(4);
Valid.ge(4).assert(4);
Valid.ge(4).assert(5);
Valid.gt(4).assert(6);
Valid.eq(4).assert(1, "is not equal to 4");
Valid.ge(4).assert(2, "is not greater than or equal to 4");
Valid.gt(4).assert(3, "is not greater than 4");
Valid.gt(4).assert(4, "is not greater than 4");
Valid.ne(4).assert(4, "is equal to 4");
Valid.lt(4).assert(4, "is not less than 4");
Valid.lt(4).assert(5, "is not less than 4");
Valid.le(4).assert(6, "is not less than or equal to 4");
Valid.ne('yyz').assert('Yyz');
Valid.lt('yyz').assert('xyza');
Valid.le('yyz').assert('xyz');
Valid.le('yyz').assert('yyz');
Valid.eq('yyz').assert('yyz');
Valid.ge('yyz').assert('yyza');
Valid.ge('yyz').assert('yyz');
Valid.gt('yyz').assert('yyzz');
Valid.eq('yyz').assert('Yyz', "is not equal to 'yyz'");
Valid.ge('yyz').assert('xyza', "is not greater than or equal to 'yyz'");
Valid.gt('yyz').assert('xyz', "is not greater than 'yyz'");
Valid.gt('yyz').assert('yyz', "is not greater than 'yyz'");
Valid.ne('yyz').assert('yyz', "is equal to 'yyz'");
Valid.lt('yyz').assert('yyza', "is not less than 'yyz'");
Valid.lt('yyz').assert('yyz', "is not less than 'yyz'");
Valid.le('yyz').assert('yyzz', "is not less than or equal to 'yyz'");

// optional
Valid.optional().assert(undefined);   // an optional with no tests is equivalent to nop()
Valid.optional().integer().assert(undefined);
Valid.optional().integer().assert(null);
Valid.optional().integer().assert(12);
Valid.optional().integer().assert("12", "is not an integer");

// static
var nullOrString = Valid.or(Valid.nil(), Valid.string());
nullOrString.assert(null);
nullOrString.assert('123');
nullOrString.assert(123, "is not equal to null and is of type number not string");



// closure leak meant only one test would be queued, not all three
Valid.equal(3).assert(Valid.undef().nil().number()._queue.length );
// closure leak meant all matches were appended to the same Chain
Valid.equal(2).assert( Valid.match(/^abc$/)._queue.length );

