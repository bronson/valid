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

    Valid.optional().string().check(null);       // can be null, undefined, or a string
    Valid.array(Valid.integer).check([1,2,3]);   // checks each item in the array
    var isHex = Valid.match(/^[0-9A-F]$/i).message("should be a hexadecimal number");

    // test JSON structures:
    var Schema = {
        Name:     Valid.notBlank(),
        Address: {
            State:    /^[A-Z][A-Z]$/,  // shortcut for Valid.match(/^[A-Z][A-Z]$/)
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

    Valid.json(Schema).check(data);

    // Easily define your own validations:
    Valid.isPowerOfTen = Valid.mod(10).message("should be a power of ten).define();
    Valid.min(10).max(100).isPowerOfTen().check(50);
```

# Gruntles

This library is scary new.

- covert to Rails-like "5 should equal 4" instead of current "5 is not equal to 4"?
- simplify error objects
- try to shrink the api, implement kitchen-sink
- npm publish
- pass a json schema to array()?  factor into RunSubtest & have everything call this.
- write isDate, isBefore, isAfter
- write isEmail() isIP() isUrl() isUUID()
- test coverage?
- Allow putting value first?  i.e. Valid(9).lt(12).gt(10) throws "9 is not greater than 10"
- write an assertion function?  Valid.assert(12).integer().min(5);
- convert to using nested functions instead of the `__queue` array?
- do a doctest somehow

# Introduction

Valid allows you to declare a validation and then test it against
any number of values:

```javascript
    var validation = Valid.integer().even().min(6);
    validation.check(9);      // returns "9 is not even"
    validation.isValid(10);   // returns true.
```

check() returns undefined if the validation succeeds, a string like "should not
be null" if it fails, or an error object for JSON validations (see _Errors_
below).  isValid() just returns true or false.

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
- Utilities: nop(), fail([message]), message(msg), todo([test])
- JSON: json(schema)

\*: These are JavaScript keywords.  While `Valid.undefined()` works
with a lot of interpreters, it doesn't work everywhere.
Each keyword validation has a more compatible alternative that should
be used instead: Valid.undef(), Valid.nil(), etc.

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
    Valid.integer().latitude().isValid(20);  // true!
```

You can also add validations that take parameters:

```javascript
    Valid.mod10 = function(rem) { return this.mod(10,rem) }
    Valid.mod10(6).check(127);   // returns "127 mod 10 is 7 not 6"
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

