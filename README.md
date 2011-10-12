# Valid

A lightweight, chaining validation library.

- Zero dependencies.  Can be used in browsers, Node, and Mongo/Couch Map/Reduce functions.
- Recursively test JSON data structures.
- Easy to extend with your own validations.
- Excellent test coverage (run `npm test`).


```javascript
    var Valid = require('valid');
    var inRange = Valid.number().min(4).max(9)
    inRange.check(7)            // returns nothing -- no errors
    inRange.check('7')          // returns "must be a number"
    inRange.check(12)           // returns "must be less than or equal to 9"

    Valid.optional().string().check(null);       // can be null, undefined, or a string
    Valid.array(Valid.integer()).check([1,2,3]);   // checks each item in the array

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

- try to shrink the api, implement kitchen-sink
- npm publish
- pass a json schema to array()?  factor into RunSubtest & have everything call this.
- write isDate, isBefore, isAfter
- write isEmail() isIP() isUrl() isUUID()
- Pass error message to Valid constructor?  make errorMessage a synonym for message?
- test coverage?
- Allow putting value first?  i.e. Valid(9).lt(12).gt(10) throws "9 is not greater than 10"
- write an assertion function?  Valid.assert(12).integer().min(5);
- convert to using nested functions instead of the `__queue` array?
- 'not' should try to modify the error message on the way through
- do a doctest somehow

# Introduction

Valid allows you to declare a validation and run it against any number of
values:

```javascript
    var validation = Valid.integer().even().min(6);
    validation.check(9);      // returns "9 is not even"
    validation.isValid(10);   // returns true.
```

check() returns undefined if the validation succeeds, a string like "should not
be null" if it fails, or an error object for JSON validations (see _Errors_
below).  isValid() just returns true or false.

# Built-In Validations

This list is probably incomplete but the code at the bottom of
[valid.js](https://github.com/bronson/valid/blob/master/lib/valid.js)
should be reasonably readable.

- Presence: defined(), undef(), \*undefined(), nil(), \*null(), notNull()
- Equality: equal(a[,b...]), notEqual(...), oneOf(arrayOrObject), \*in(arrayOrObject)
- Comparison: eq(n), lt(n), le(n), ge(n), gt(n), ne(n)
- Numbers: number(), integer(), mod(x[,rem]), even(), odd()
- Arrays: array([validationForEachItem]), len(min,max), empty()
- Strings: string(), len(min,max), blank(), notBlank()
- Regexps: match(regex[,modifiers]), nomatch(regex[,modifiers])
- Logic: and(test[,test...]), or(test[,test...]), not(test,message)
- Utilities: nop(), fail([message]), message(msg), todo([test])
- JSON: json(schema)

\*: These function names are also JavaScript keywords.  While
`Valid.undefined()` works with a lot of interpreters, it doesn't work
everywhere.  Each keyword validation has a more compatible alternative that
should be used instead: Valid.undef(), Valid.nil(), etc.

# Errors

When a validation fails, check() returns a concise, positive message with the
value implied at the front: "must be even", "can't be blank", etc.  The messages
are meant to be understandable by end users.

Concatenating the value and message is one obvioius use ("7 must be even"), but
this style of wording is useful in other ways too.  For instance, a web app can
display the message to the right of the form element containing the error.

It's easy to supply your own error messages:

   Valid.match(/-/).message("must contain a dash")

Because JSON validations need to return multiple errors, they return an object
instead of a string.  The error object has the same structure as the JSON
except that arrays are converted into objects.

```javascript
    {
        Name: "is blank",
        Address: {
            State: "doesn't match /[A-Z][A-Z]/"
        }
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
    Valid.mod10 = function(rem) { return this.mod(10,rem).message("must end in" + rem); }
    Valid.mod10(6).check(127);   // returns "must end in 6"
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

