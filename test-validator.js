var Validator = require('./validator');


// todo: make invalid last so tests are more readable


// Modifies the Validator to ensure expected errors are caught
var Checker = function(template, error) {
  Validator.call(this, template, error);
}
Checker.prototype.constructor = Checker;
Checker.prototype = new Validator();


// To make an invalid schema pass: Checker.create(null).invalid("1 is not null").validate(1)
Checker.prototype.invalid = function(strs) {
  this.error_strings = (strs instanceof Array ? strs : [strs]);
  return this;
}

Checker.prototype.error = function(msg) {
  msg = this.error_str(msg);
  if(this.error_strings) {
    if(this.error_strings[0] == msg) {
      this.error_strings.shift();
    } else {
      throw "expected <<" + this.error_strings[0] + ">> but got <<" + msg + ">>";
    }
  } else {
    throw "expected no error but got <<" + msg + ">>";
  }
}

Checker.prototype.validate = function(object) {
  Validator.prototype.validate.call(this, object);
  if(this.error_strings && this.error_strings.length > 0) {
    throw "expected <<" + this.error_strings[0] + ">> but got nothing.";
  }
}

Checker.create = function(template) {
    return new this(template);
};


// constants
Checker.create(null).validate(null);
Checker.create(null).invalid("1 is not null").validate(1);
Checker.create(null).invalid("undefined is not null").validate(undefined);
Checker.create(undefined).validate(undefined);
Checker.create(undefined).invalid("1 is not undefined").validate(1);
Checker.create(undefined).invalid("null is not undefined").validate(null);

Checker.create(true).validate(true);
Checker.create(false).validate(false);
Checker.create(true).invalid("false is not true").validate(false);
Checker.create(false).invalid("true is not false").validate(true);
Checker.create(false).invalid("undefined is not false").validate(undefined);

Checker.create('abc').validate('abc');
Checker.create(123).validate(123);
Checker.create(/^abc$/).validate('abc');
Checker.create(/^abc$/).invalid("'abcd' doesn't match /^abc$/").validate('abcd');


Checker.create({abc: 123}).validate({abc: 123});
Checker.create({abc: 123, def: 456}).invalid("[object Object] is missing def").validate({abc: 123});
Checker.create({abc: 123}).invalid("[object Object] has def but template doesn't").validate({abc: 123, def: 456});

Checker.create(function (val) { if(val != 123) this.error(val, "nope!"); }).validate(123);


Checker.create(Validator.IsAnything).validate(123);
Checker.create(Validator.IsAnything).validate(undefined);
Checker.create(Validator.IsDefined).validate(123);
Checker.create(Validator.IsNumber).validate(123);
Checker.create(Validator.IsInteger).validate(123.0);
Checker.create(Validator.IsNotBlank).validate('0');
Checker.create(Validator.IsOptional(Validator.IsInteger)).validate(undefined);
Checker.create(Validator.IsOptional(Validator.IsInteger)).validate(12);

Checker.create([12, 13]).validate([12, 13]);
Checker.create([12, Validator.IsInteger]).validate([12, 13]);

var _ = Validator;
Checker.create(_.IsArray(_.IsInteger)).validate([12, 13, 14]);
Checker.create(_.IsArray(_.IsInteger, {min: 1, max: 3})).validate([12, 13]);


/*

Validator.create(function (val) { this.error("nope for " + val + "!") }).validate(123);

Validator.create(Validator.IsDefined).validate(null);
Validator.create(Validator.IsDefined).validate(undefined);
Validator.create(Validator.IsInteger).validate(123.1);
Validator.create(Validator.IsNotBlank).validate(' a');
Validator.create(Validator.IsNotBlank).validate('');
Validator.create(Validator.IsOptional(Validator.IsInteger)).validate(12.1);

Validator.create([12, 13]).validate([12, 14]);
Validator.create([12, 13]).validate(12);
Validator.create([12, 13]).validate(undefined);

with(Validator) {
  Validator.create(IsArray(IsString, {min: 1, max: 3})).validate([12, 13]);
  Validator.create(IsArray(IsInteger, {min: 3, max: 4})).validate([12, 13]);
  Validator.create(IsArray(IsInteger, {min: 1, max: 0})).validate([12, 13]);
}
*/
