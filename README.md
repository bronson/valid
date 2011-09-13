# js-validate

- Small, light, zero dependencies.
- Can be used in Node, browsers, and Mongo/Couch Map/Reduce functions.
- Fills in an error object like ActiveRecord validations.
- Can be used declaratively as well as immediately.
- Good test coverage.

TODO: demonstrate declarative

TODO: demonstrate immediate


# Alternatives

## node-validator

<https://github.com/chriso/node-validator>

- Only supports immediate use, can't declare validations.
- The syntax is pretty sweet: `check('abc').len(6,12).isEmail();`
- only meant to work inside node?


<https://github.com/doffm/Onvalid>

- Only supports static use, can't do quick immediate validations.
- Doesn't do static schemas (`{12}` doesn't work, must use `{\__.eq(12)}`
- Produces unsatisfying error messages on deeply nested schemas.


# License

Pain-free MIT.

