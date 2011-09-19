var Valid = require('./valid');

// Like check() but throws if the result doesn't match the expectation
Valid.assert = function assert(value, expected) {
    var actual = this.test(value);
    if(expected !== actual) {
        var exstr = (expected === undefined ? "success" : "'" + expected + "'");
        var acstr = (actual === undefined ? "success" : "'" + actual + "'");
        throw value + ": expected " + exstr + " but got " + acstr;
    }
};

Valid.assert("any value", "no tests!");

Valid.undefined().assert(undefined);
Valid.undefined().assert(1, "is not equal to undefined");
Valid.undefined().assert(null, "is not equal to undefined");
Valid.defined().assert(undefined, "is undefined");
Valid.defined().assert(1);
Valid.defined().assert(null);

Valid.null().assert(null);
Valid.null().assert(1, "is not equal to null");              // "is not null" would sound better
Valid.null().assert(undefined, "is not equal to null");
Valid.notNull().assert(null, "is null");
Valid.notNull().assert(1);
Valid.notNull().assert(undefined);

Valid.exists().assert(0);
Valid.exists().assert(false);
Valid.exists().assert(null, "does not exist");
Valid.exists().assert(undefined, "does not exist");


// closure leak meant only one test would be queued, not all three
Valid.equal(null).assert(null);
Valid.equal(null).assert(undefined, "is not equal to null");
Valid.equal(3).assert(Valid.undefined().null().number()._queue.length );
Valid.notEqual(null).assert(undefined);
Valid.notEqual(null).assert(null, "is equal to null");


Valid.typeOf('undefined').assert(undefined);
// typeof null returns 'object' on some JS implementations, use null()
Valid.typeOf('number').assert(123);
Valid.typeOf('string').assert('123');
Valid.typeOf('garbage').assert('123', "is of type string not garbage");
Valid.typeOf(undefined).assert(undefined, "typeOf requires a string argument, not undefined");
Valid.typeOf(123).assert(123, "typeOf requires a string argument, not number");

// booleans
Valid.boolean().assert(true);
Valid.boolean().assert(false);
Valid.boolean().assert(undefined, "is of type undefined not boolean");
Valid.true().assert(true);
Valid.true().assert(false, "is not equal to true");
Valid.false().assert(false);
Valid.false().assert(true, "is not equal to false");

// numbers
Valid.number().assert(123);
Valid.number().assert('123', "is of type string not number");
Valid.number().assert(undefined, "is of type undefined not number");
Valid.integer().assert(123.0);
Valid.integer().assert('123.0', "is of type string not number");
Valid.integer().assert(123.1, "is not an integer");

// strings
Valid.string().assert(' 123');
Valid.string().assert(undefined, "is of type undefined not string");
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

// regexes
Valid.match(/^.*$/).assert('');
Valid.match(/^abc$/).assert('abc');
Valid.match(/^abc$/).assert('abcd', "does not match /^abc$/");
Valid.match(/^abc$/).assert(undefined, "is of type undefined not string");
Valid.match(/1/).assert(1, "is of type number not string");
Valid.equal(2).assert( Valid.match(/^abc$/)._queue.length ); // closure leak meant all matches were appended to the same Chain

Valid.and().assert(null);                         // passing 0 tests succeeds unconditionally
Valid.and( Valid.null() ).assert(null);                            // passing 1 arg success
Valid.and( Valid.null() ).assert(undefined, "is not equal to null"); // passing 1 arg failure
Valid.and( Valid.typeOf('string'), Valid.match(/c$/), Valid.match(/^a/) ).assert('abc');
Valid.and( Valid.typeOf('string'), Valid.match(/^bbc$/) ).assert('abc', "does not match /^bbc$/");
Valid.and( Valid.typeOf('number'), Valid.match(/^abc$/) ).assert('abc', "is of type string not number");

Valid.or().assert(undefined);                     // passing 0 tests succeeds unconditionally
Valid.or( Valid.null() ).assert(null);                            // passing 1 arg success
Valid.or( Valid.null() ).assert(undefined, "is not equal to null"); // passing 1 arg failure
Valid.or( Valid.null(), Valid.undefined() ).assert(undefined);
Valid.or( Valid.null(), Valid.undefined() ).assert(null);
Valid.or( Valid.null(), Valid.number(), Valid.string() ).assert('mosdef');
Valid.or( Valid.undefined(), Valid.match(/^abc$/), Valid.match(/def$/) ).assert('mosdef');
Valid.or( Valid.typeOf('number'), Valid.match(/^bbc$/) ).assert('abc', "is of type string not number and does not match /^bbc$/");

var nullOrString = Valid.or(Valid.null(), Valid.string());
nullOrString.assert(null);
nullOrString.assert('123');
nullOrString.assert(123, "is not equal to null and is of type number not string");

/*
schema( Validator.IsAnything    ).validate(123).result();
schema( Validator.IsAnything    ).validate(undefined).result();
schema( Validator.IsDefined     ).validate(123).result();
schema( Validator.IsDefined     ).validate(null).result("null is not defined");
schema( Validator.IsDefined     ).validate(undefined).result("undefined is not defined");
schema( Validator.IsNumber      ).validate(123).result();
schema( Validator.IsNotBlank    ).validate('0').result();
schema( Validator.IsNotBlank    ).validate(' a').result("' a' has leading whitespace");
schema( Validator.IsNotBlank    ).validate('').result("'' can't be blank");
*/

Valid.optional(Valid.integer()).assert(undefined);
Valid.optional(Valid.integer()).assert(12);
Valid.optional(Valid.integer()).assert("12", "is optional and is of type string not number");

/*
schema( true  ).validate( true  ).result();
schema( false ).validate( false ).result();
schema( true  ).validate( false ).result("false is not true");
schema( false ).validate( true  ).result("true is not false");
schema( false ).validate(undefined).result("undefined is not false");

schema( 'abc'   ).validate( 'abc'  ).result();
schema( 'abc'   ).validate( 'abc ' ).result("'abc ' does not equal 'abc'");
schema( 123     ).validate( 123    ).result();
schema( 123     ).validate( 123.1  ).result("123.1 does not equal 123");
schema( /^abc$/ ).validate( 'abc'  ).result();
schema( /^abc$/ ).validate( 'abcd' ).result("'abcd' does not match /^abc$/");

schema( {abc: 123}           ).validate( {abc: 123}           ).result();
schema( {abc: 123, def: 456} ).validate( {abc: 123}           ).result("[object Object] is missing def");
schema( {abc: 123}           ).validate( {abc: 123, def: 456} ).result("[object Object] has def but template does not");

schema( {a: {b: {c: 1}}}     ).validate( {a: {b: {c: 2}}}     ).result("a,b,c: 2 does not equal 1 for [object Object]");  // TODO: improve error message

// arrays
schema( [12, 13] ).validate( [12, 13] ).result();
schema( [12, 13] ).validate( [12, 14]  ).result("1: 14 does not equal 13 for 12,14"); // TODO improve error message
schema( [12, 13] ).validate( 12        ).result("12 is not an Array");
schema( [12, 13] ).validate( undefined ).result("undefined is not an Array");
schema( [12, Validator.IsInteger] ).validate( [12, 13] ).result();

var _ = Validator;
schema( _.IsArray(_.IsInteger) ).validate([12, 13, 14]).result();
schema( _.IsArray(_.IsInteger, {min: 1, max: 3}) ).validate([12, 13]).result();
schema( _.IsArray(_.IsString,  {min: 1, max: 3}) ).validate([12, 13]).result(["0: 12 is number, not string for 12,13", "1: 13 is number, not string for 12,13"]); // TODO: improve error message
schema( _.IsArray(_.IsInteger, {min: 3, max: 4}) ).validate([12, 13]).result("12,13 has fewer than 3 elements");
schema( _.IsArray(_.IsInteger, {min: 1, max: 0}) ).validate([12, 13]).result("12,13 has more than 0 elements");

*/
