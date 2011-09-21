# Valid

A lightweight, chaining validation library.

- Zero dependencies.  Can be used in browsers, Node, and Mongo/Couch Map/Reduce functions.
- Recursively tests JSON data structures.
- Easy to extend with your own validations.
- Excellent test coverage (run `npm test`).


```javascript
    var Valid = require('valid');
    var inRange = Valid.number().min(4).max(9)
    inRange.check(3)            // check returns true/false, here it returns false
    inRange.test(12)            // returns "is not less than or equal to 9"
    inRange.odd().verify(6)     // throws "6 is not odd"

    Valid.optional().string()   // success is null, undefined, or a string
    Valid.array(Valid.integer).verify([1,2,3]);  // each item in the array must be an integer

    // validate JSON:
    var Valid = require('validjson');

    var Schema = {
        Name:     Valid.notBlank(),
        Numbers:  Valid.array(Valid.integer()).len(2,5),
        State:    /^[A-Z][A-Z]$/,
        Country:  "US"
    };

    var Data = {
        Name:     "Jed",
        Numbers:  [1, 9, 25],
        State:    "CA",
        Country:  "US"
    }

    Valid.json(Schema).verify(Data);
```

# Gruntles

This library is scary new.

- test? valid? check?  Could these names be more generic?
- todo: isDate, isBefore, isAfter
- todo: isEmail() isIP() isUrl() isUUID()
- Valid is not a great name. it's not even a noun.
- noexisty is a stupid name
- should valid and validjson really be in separate modules?
- Allow putting value first?  i.e. Valid(9).lt(12).gt(10) throws "9 is not greater than 10"
- Allow returning multiple errors for a single field, like Rails validations?


# Built-In Validations

This is probably incomplete.
See [valid.js](https://github.com/bronson/valid/blob/master/lib/valid.js).

- equal(a[,b...]), notEqual(...), oneOf(arrayOrObject)
- defined(), undef(), undefined()
- nil(), null(), notNull()
- exists(), noexisty()  (!)
- array([test]), len(min,max), empty()
- boolean(), true(), false()
- number(), integer(), mod(x[,rem]), even(), odd(), max(n), min(n)
- string([test]), len(min,max), blank(), notBlank()
- match(regex[,modifiers]), nomatch(regex[,modifiers])
- eq(n), lt(n), le(n), ge(n), gt(n), ne(n)
- nop(), fail([message]), messageFor(test,message), todo([test])
- and(test[,test...]), or(test[,test...]), not(test,message)
- json(schema)


# Errors

When a validation fails, the validation returns a string ready
for concatenation: "is not even", "is not equal to 12", "mod 4 is 2".
If the error is being thrown then the failing value is tacked onto the front:
"3 is not even", "null is not equal to 12", "6 mod 4 is 2".

There is one exception: JSON validations.  Because they can return multiple
errors, they return an object instead of a string:

```javascript
    {
        "Name"               : { message: "is blank", value: "" },
        "Addresses[0].State" : { message: "doesn't match /[A-Z][A-Z]/", value: "ca" }
    }
```


# Extending Valid

To define your own tests, just end the chain with "define()"
and add it to the root object:

```javascript
    Valid.latitude  = Valid.ge(-90).le(90).define();
    Valid.longitude = Valid.ge(-180).le(180).define();
    Valid.integer().latitude().verify(20);    // success!
```

You can also add tests that take parameters:

```javascript
    Valid.mod10 = function(rem) { return this.mod(10,rem) }
    Valid.mod10(6).verify(127);   // throws "127 mod 10 is 7 not 6"
```

Or just rename them:

```javascript
    Valid.every = Valid.and;
    Valid.any = Valid.or;
```


# Alternatives

<https://github.com/chriso/node-validator>

- The syntax is pretty sweet: `check('abc').len(6,12).isEmail();`
- Only supports immediate use, can't declare validations.
- Only meant to work inside node.  Can't recurse over JSON.

<https://github.com/doffm/Onvalid>

- Validates JSON using a declared schema.
- Only supports static use, can't do immediate validations.
- Produces unsatisfying error messages on deeply nested schemas.


# License

Pain-free MIT.

