var Valid = require('./valid');

// Like check() but throws if the result doesn't match the expectation
Valid.assert = function assert(value, expected) {
    var actual = this.test(value);
    if(expected !== actual) {
        var str = (expected === undefined ? "success" : "'" + expected + "'");
        throw value + ": expected " + str + " but got '" + actual + "'";
    }
}

Valid.assert(null, "no tests!");

Valid.isUndefined().assert(undefined);
Valid.isUndefined().assert(1, "doesn't equal undefined");
Valid.isUndefined().assert(null, "doesn't equal undefined");

Valid.isNull().assert(null);
Valid.isNull().assert(1, "doesn't equal null");              // "is not null" would sound better
Valid.isNull().assert(undefined, "doesn't equal null");

Valid.equal(3).assert(Valid.isUndefined().isNull().isNumber()._queue.length ); // closure leak meant only one test would be queued, not all three

Valid.typeOf('undefined').assert(undefined);
// typeof null returns 'object' on some JS implementations, use isNull()
Valid.typeOf('number').assert(123);
Valid.typeOf('string').assert('123');
Valid.typeOf('garbage').assert('123', "is of type string not garbage");
Valid.typeOf(undefined).assert(undefined, "typeOf requires a string argument, not type undefined");
Valid.typeOf(123).assert(123, "typeOf requires a string argument, not type number");

// booleans
Valid.isBoolean().assert(true);
Valid.isBoolean().assert(false);
Valid.isBoolean().assert(undefined, "is of type undefined not boolean");
Valid.isTrue().assert(true);
Valid.isTrue().assert(false, "doesn't equal true");
Valid.isFalse().assert(false);
Valid.isFalse().assert(true, "doesn't equal false");

// numbers
Valid.isNumber().assert(123);
Valid.isNumber().assert('123', "is of type string not number");
Valid.isNumber().assert(undefined, "is of type undefined not number");

// strings
Valid.isString().assert('123');
Valid.isString().assert(undefined, "is of type undefined not string");

// regexes
Valid.match(/^abc$/).assert('abc');
Valid.match(/^abc$/).assert('abcd', "doesn't match /^abc$/");
Valid.match(/^abc$/).assert(undefined, "is of type undefined not string");
Valid.equal(2).assert( Valid.match(/^abc$/)._queue.length ); // closure leak meant all matches were appended to the same Chain
  // todo: Valid.assert(Valid.match(/^abc$/)._queue.length).equal(2) ?
  // todo: Valid.value(Valid.match(/^abc$/)._queue.length).equal(2).assert()

// operators
Valid.and( Valid.typeOf('string'), Valid.match(/^abc$/), Valid.match(/^a/) ).assert('abc');
Valid.and( Valid.typeOf('string'), Valid.match(/^bbc$/) ).assert('abc', "doesn't match /^bbc$/");
Valid.and( Valid.typeOf('number'), Valid.match(/^abc$/) ).assert('abc', "is of type string not number");
Valid.and().assert(null);                         // passing 0 tests succeeds unconditionally
Valid.and( Valid.isNull() ).assert(null);                            // passing 1 arg success
Valid.and( Valid.isNull() ).assert(undefined, "doesn't equal null"); // passing 1 arg failur

/*
Valid.or( Valid.isNull(), Valid.isUndefined() ).assert(undefined);
Valid.or( Valid.isNull(), Valid.isNull(), Valid.isNull() ).assert(null);
Valid.or( Valid.isNull(), Valid.isNumber(), Valid.isString() ).assert('mosdef');
Valid.or( Valid.isUndefined(), Valid.match(/^abc$/), Valid.match(/def$/) ).assert('mosdef');
Valid.or( Valid.typeOf('string'), Valid.match(/^bbc$/) ).assert('abc', "doesn't match /^bbc$/");
Valid.or( Valid.typeOf('number'), Valid.match(/^abc$/) ).assert('abc', "is of type string not number");
Valid.or().test(null, "no tests!");
Valid.or( Valid.isNull() ).test(null);

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
schema( /^abc$/ ).validate( 'abcd' ).result("'abcd' doesn't match /^abc$/");

schema( {abc: 123}           ).validate( {abc: 123}           ).result();
schema( {abc: 123, def: 456} ).validate( {abc: 123}           ).result("[object Object] is missing def");
schema( {abc: 123}           ).validate( {abc: 123, def: 456} ).result("[object Object] has def but template doesn't");

schema( {a: {b: {c: 1}}}     ).validate( {a: {b: {c: 2}}}     ).result("a,b,c: 2 does not equal 1 for [object Object]");  // TODO: improve error message

// compare functions
schema( Validator.IsAnything    ).validate(123).result();
schema( Validator.IsAnything    ).validate(undefined).result();
schema( Validator.IsDefined     ).validate(123).result();
schema( Validator.IsDefined     ).validate(null).result("null is not defined");
schema( Validator.IsDefined     ).validate(undefined).result("undefined is not defined");
schema( Validator.IsNumber      ).validate(123).result();
schema( Validator.IsInteger     ).validate(123.0).result();
schema( Validator.IsInteger     ).validate(123.1).result("123.1 is not an integer");
schema( Validator.IsNotBlank    ).validate('0').result();
schema( Validator.IsNotBlank    ).validate(' a').result("' a' has leading whitespace");
schema( Validator.IsNotBlank    ).validate('').result("'' can't be blank");

schema( Validator.IsOptional(Validator.IsInteger) ).validate(undefined).result();
schema( Validator.IsOptional(Validator.IsInteger) ).validate(12).result();

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
