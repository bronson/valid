var Validator = require('./validator');


// todo: make invalid last so tests are more readable


// Modifies the Validator to ensure expected errors are caught
var Checker = function(template, error) {
  Validator.call(this, template, error);
  this.error_strings = [];
}
Checker.prototype.constructor = Checker;    // is this necessary?
Checker.prototype = new Validator();

Checker.prototype.error = function(msg) {
  this.error_strings.push(this.error_str(msg));
}

Checker.prototype.result = function(expected) {
  if(expected === undefined) expected = [];
  if(typeof expected == 'string') expected = [expected];
  var actual = this.error_strings;

  if(expected.length == 0 && actual.length > 0) {
    throw "expected no error but got [" + actual + "]";
  } else if(expected.length > 0 && actual.length == 0) {
    throw "expected [" + expected + "] but got nothing.";
  } else if(expected.length != actual.length) {
    throw "expected " + expected.length + " [" + expected +
      "] but got " + actual.length + " [" + actual + "]";
  } else {
    for(var i=0; i<expected.length; i++) {
      if(expected[i] !== actual[i]) {
        throw "expected [" + expected + "] but got [" + actual[i] + "] (they differ at " + i + ")";
      }
    }
    // expected and actual are identical
  }
}


Checker.create = function(template) {
  return new this(template);
};


function schema(tmpl) { return Checker.create(tmpl); }

// constants
schema( null      ).validate( null      ).result();   // same as Validator.create(null).validate(null)
schema( null      ).validate( 1         ).result("1 is not null");
schema( null      ).validate( undefined ).result("undefined is not null");

schema( undefined ).validate( undefined ).result();
schema( undefined ).validate( 1         ).result("1 is not undefined");
schema( undefined ).validate( null      ).result("null is not undefined");

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

schema( function (val) { if(val != 123) this.error("nope!"); } ).validate(123).result();
schema( function (val) { if(val == 123) this.error("is equal"); } ).validate(123).result("123 is equal");

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

