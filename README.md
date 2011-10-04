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

    var Schema = {
        Name:     Valid.notBlank(),
        Numbers:  Valid.array(Valid.integer()).len(2,5),   // an array of 2, 3, 4, or 5 integers
        Address: {
            State:    /^[A-Z][A-Z]$/,                      // shortcut for Valid.match(/^[A-Z][A-Z]$/)
            Country:  "US"
        }
    };

    var data = {
        Name:     "Jed",
        Numbers:  [1, 9, 25],
        Address: {
            State:    "CA",
            Country:  "US"
        }
    }

    Valid.json(Schema).verify(data);
```

# Gruntles

This library is scary new.

- test? valid? check?  Could these names be more generic?
- todo: isDate, isBefore, isAfter
- todo: isEmail() isIP() isUrl() isUUID()
- Valid is not a great name. it's not even a noun.
- noexisty is a stupid name
- covert to Rails-like "5 should equal 4" instead of current "5 is not equal to 4"?
- Allow putting value first?  i.e. Valid(9).lt(12).gt(10) throws "9 is not greater than 10"

# Introduction

Valid allows you to declare strings of validations and
use them to test different values:

```javascript
    var checker = Valid.integer().even().min(6);
    checker.verify(9);    // throws "9 is not even"
    checker.verify(10);   // succeeds
```

Valid offers three ways of testing values:

- test(val) -- returns undefined on success or the error if the validation failed.
- check(val) -- returns true or false.
- verify(val) -- throws the error if the validation fails.

The error will be a string for simple validations or an object
for JSON validations (see _Errors_ below).

# Built-In Validations

This is probably incomplete.
See [valid.js](https://github.com/bronson/valid/blob/master/lib/valid.js).

- Presence: defined(), undef(), undefined\*(), nil(), null\*(), notNull()
- Equality: equal(a[,b...]), notEqual(...), oneOf(arrayOrObject), in\*(arrayOrObject)
- Comparison: eq(n), lt(n), le(n), ge(n), gt(n), ne(n)
- Numbers: number(), integer(), mod(x[,rem]), even(), odd()
- Booleans: boolean(), isTrue(), true\*(), isFalse(), false\*()
- Arrays: array([validationForEachItem]), len(min,max), empty()
- Strings: string(), len(min,max), blank(), notBlank()
- Regexps: match(regex[,modifiers]), nomatch(regex[,modifiers])
- Logic: and(test[,test...]), or(test[,test...]), not(test,message)
- Utilities: nop(), fail([message]), messageFor(test,message), todo([test])
- JSON: json(schema)

\*: These are JavaScript keywords.  While `Valid.undefined()` will work
with a lot of interpreters, it won't work everywhere.
Each keyword validation has a more compatible alternative: Valid.undef(), Valid.nil(), etc.

# Errors

When a validation fails, the validation returns a string ready
for concatenation: "is not even", "is not equal to 12", "mod 4 is 2".
If the error is being thrown then the failing value is tacked onto the front:
"3 is not even", "null is not equal to 12", "6 mod 4 is 2".

There is one exception: JSON validations.  Because they can return multiple
errors, they return an object instead of a string.  The `value` field contains
the value that failed to validate.

```javascript
    {
        "Name"               : { message: "is blank", value: "" },
        "Addresses[0].State" : { message: "doesn't match /[A-Z][A-Z]/", value: "ca" }
    }
```


# Extending Valid

To define your own validations, just end the chain with "define()"
and add it to the root object:

```javascript
    Valid.latitude  = Valid.ge(-90).le(90).define();
    Valid.longitude = Valid.ge(-180).le(180).define();
    Valid.integer().latitude().verify(20);    // success!
```

You can also add validations that take parameters:

```javascript
    Valid.mod10 = function(rem) { return this.mod(10,rem) }
    Valid.mod10(6).verify(127);   // throws "127 mod 10 is 7 not 6"
```

Or just rename them:

```javascript
    Valid.every = Valid.and;
    Valid.any = Valid.or;
```


# Weirdness

On Node 0.4.x, if the console tries to print a Valid chain, you
get this error:

    > Valid.integer()
    TypeError: Function.prototype.toString is not generic
        at Function.toString (native)
        at Array.toString (native)

It's a Node bug.  0.5.x does the correct thing and prints the
chain:

    > Valid.integer()
    { _queue: 
       [ { [Function: SimpleTest] data: [Object] },
         { [Function: SimpleTest] data: [Object] } ] }


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

