var Validator = require('./validator');

// constants
Validator.create('abc').validate('abc');
Validator.create(123).validate(123);
Validator.create(/^abc$/).validate('abc');
Validator.create(true).validate(true);
Validator.create(false).validate(false);
Validator.create(null).validate(null);
Validator.create(undefined).validate(undefined);
Validator.create({abc: 123}).validate({abc: 123});

Validator.create(function (val) { if(val != 123) this.error(val, "nope!"); }).validate(123);

Validator.create(Validator.IsAnything).validate(123);
Validator.create(Validator.IsAnything).validate(undefined);
Validator.create(Validator.IsDefined).validate(123);
Validator.create(Validator.IsNumber).validate(123);
Validator.create(Validator.IsInteger).validate(123.0);
Validator.create(Validator.IsNotBlank).validate('0');
Validator.create(Validator.IsOptional(Validator.IsInteger)).validate(undefined);
Validator.create(Validator.IsOptional(Validator.IsInteger)).validate(12);

Validator.create([12, 13]).validate([12, 13]);
Validator.create([12, Validator.IsInteger]).validate([12, 13]);

with(Validator) {
  Validator.create(IsArray(IsInteger)).validate([12, 13, 14]);
  Validator.create(IsArray(IsInteger, {min: 1, max: 3})).validate([12, 13]);
}


/*
Validator.create(null).validate(1);
Validator.create(undefined).validate(1);

Validator.create('abc').validate(123);
Validator.create(/^abc$/).validate('abcd');
Validator.create(true).validate(false);
Validator.create(false).validate(true);
Validator.create(null).validate(undefined);
Validator.create(undefined).validate(null);
Validator.create({abc: 123, def: 456}).validate({abc: 123});
Validator.create({abc: 123}).validate({abc: 123, def: 456});

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

Validator.create(IsArray(IsString, {min: 1, max: 3})).validate([12, 13]);
Validator.create(IsArray(IsInteger, {min: 3, max: 4})).validate([12, 13]);
Validator.create(IsArray(IsInteger, {min: 1, max: 0})).validate([12, 13]);
*/
