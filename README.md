# jsvalid

- Small, light, zero dependencies.
- Can be used in Node, browsers, and Mongo/Couch Map/Reduce functions.
- Can recursively test JSON data structures.
- Easy to extend with your own validations.
- Tests be used declaratively as well as immediately.
- Good test coverage.


### Declarative

  var inRange = Valid.min(4).max(9)
  inRange.verify(12)    // throws an error
  var stringInRange = inRange.typeof('string').errorHandler(Valid.TrueFalse)
  if(stringInRange.validate("not in range")) { /\* not executed \*/ }


### Immediate

  var check = Valid.checker(TrueFalse);  // uses Throw by default
  if(check(12).inRange(4,9)) { /\* not executed \*/ }

what about going insane?

  Object.prototype.assert = Valid.checker().errorHandler(Valid.Throw);
  12.assert().min(4).max(9);    // throws an error


# Handling Validation Errors

By default the validator raises an error when it finds invalid data
(using the Valid.Throw handler).  To make it return a boolean result:

  Valid.errorHandler(Valid.TrueFalse).validate(false);

### Throw

### Console

### TrueFalse

### ErrorObject   (included with json-valid)

  errors: an error object
    .add([field], msg)  -- adds a message for the field.  A field of "." refers to the entire object.
    .clear()            -- clears all error messages
    .count([field])     -- tells how many total errors or just for the given field
    .messages([field])  -- returns an array of all error messages concated with field name


# Built-In Validations

Don't include validations by default?
  Syntax is very personal.  Do you prefer in, contains, isIn, etc?
Don't do isBlah.  Just blah.
Find the BARE MINIMUM non-composed validators.  Users can compose their own APIs.


in(1,2)          equivalent: in([1,2]) in({1:ignored,2:ignored})
          in is a keyword...  use synonym isIn if this is a problem.
              have a synonym module?  Valid.isOneOf = Valid.in

match(regex)
length(min, [max])   applies to strings, arrays, or any object that has a length field.

and(Validation, Validation, ...)
  though why would you do this since Validation.validation().validation() is the same.
or(Validation, Validation, ...)
not(Validation)
  Make any a synonym for or and every a synonym or and?
  What about not(and) and not(or)?
optional(Validation, Validation, ...)
min -- uses JS's &lt; and &gt; operators so can be used on strings too.
max --
  also gt, ge, lt, le, eq, ne?


isDate
  isBefore
  isAfter

isEmail()
isIP()
isUrl()
isUUID()

json(template) -- checks an entire json structure


We don't offer inverses because not() is usually clearer.  If you'd
rather write Valid.notIn(arr) instead of Valid.not(Valid.in(arr)),
just do this:

Valid.notIn = function(arr) { return Valid.not(Valid.in(arr)) }
Valid.notIn = Valid.not(Valid.in)    // could this work?


# Extending Valid

## Validators
  
  

## Error Handlers

  // this.field tells what field we're operating on
  Valid.errorHandler(function(message) { 


# Alternatives

<https://github.com/chriso/node-validator>

- Only supports immediate use, can't declare validations.
- The syntax is pretty sweet: `check('abc').len(6,12).isEmail();`
- only meant to work inside node?

<https://github.com/doffm/Onvalid>

- Only supports static validation, can't do quick immediate validations.
- Doesn't support static schemas (must use `{\__.eq(12)}` instead of `{12}`).
- Produces unsatisfying error messages on deeply nested schemas.


# License

Pain-free MIT.

