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
*/
