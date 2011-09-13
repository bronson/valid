var Validator = require('./validator');

Validator.create('abc').validate('abc');
Validator.create(123).validate(123);
Validator.create(/^abc$/).validate('abc');
Validator.create(true).validate('abc');
Validator.create(false).validate();
Validator.create({abc: 123}).validate({abc: 123});
Validator.create(function (val) { if(val != 123) this.error(val, "nope!"); }).validate(123);

/*
Validator.create(null).validate(1);
Validator.create(undefined).validate(1);
Validator.create('abc').validate(123);
Validator.create(/^abc$/).validate('abcd');
Validator.create(true).validate();
Validator.create(false).validate('abc');
Validator.create({abc: 123, def: 456}).validate({abc: 123});
Validator.create({abc: 123}).validate({abc: 123, def: 456});
Validator.create(function (val) { this.error("nope for " + val + "!") }).validate(123);
*/
