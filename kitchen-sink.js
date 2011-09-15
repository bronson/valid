// This module contains all the synonyms I could think of.
// It's meant to show how to use composability...  I'm not sure it makes
// sense to use it yourself.  But, if you want to:
//
// TODO: test this
//     var Valid = require('valid').extend(require('valid/synonyms'));

Valid = require('valid');




Valid.isOneOf = Valid.in;   // can also use isOneOf = Valid.in().  Same result.


// type validations
Valid.isUndefined   = Valid.typeOf('undefined');
Valid.isNull        = Valid.typeOf('null');
Valid.isBoolean     = Valid.typeOf('boolean');
Valid.isNumber      = Valid.typeOf('number');
Valid.isString      = Valid.typeOf('string');
Valid.isFunction    = Valid.typeOf('function');
Valid.isObject      = Valid.typeOf('object');
Valid.isArray       = Valid.todo;
valid.instanceOf    = Valid.todo;

Valid.exists = Valid.not(Valid.isUndefined).not(Valid.isNull);

// common integer validations
Valid.isInteger = Valid.todo();
Valid.mod = Valid.todo();

// common string validations
Valid.blank         = Valid.match(/^\s*$/);
Valid.nonBlank      = Valid.not(Valid.blank);



//        Onvalid dialect

0nvalid.and = Valid.and;
0nvalid.or = Valid.or;
0nvalid.not = Valid.not;
0nvalid.regex = Valid.match;
0nvalid.nor = Valid.not(Valid.or);
0nvalid.opt = Valid.optional;
0nvalid.exists = Valid.not(Valid.isUndefined);
0nvalid.notExists = Valid.not(Valid.exists);
0nvalid.all = Valid.todo;   // return _.every (ps, function (p) {return _.contains(p, vs);});
0nvalid._in = Valid.in;
0nvalid.nin = Valid.not(Valid.in);
0nvalid.eq = Valid.todo;
0nvalid.ne = Valid.todo;
0nvalid.gt = Valid.todo;
0nvalid.gte = Valid.todo;
0nvalid.lt = Valid.todo;
0nvalid.lte = Valid.todo;

0nvalid.isLowercase = Valid.todo;
0nvalid.isUppercase = Valid.todo;
0nvalid.isHexString = Valid.todo;

0nvalid.validate = Valid.todo;    // takes different arguments from Valid.validate


//         node-validator dialect

Validator.is = Valid.match;
Validator.not = Valid.not(Validator.is);    // very different from Valid.not
Validator.isEmail = Valid.isEmail;
Validator.isUrl = Valid.isUrl;
Validator.isIP = Valid.isIP;
Validator.isAlpha = Valid.match(/^[a-zA-Z]+$/);
Validator.isAlphanumeric = Valid.match(/^[a-zA-Z0-9]+$/);
Validator.isNumeric = Valid.match(/^-?[0-9]+$/);
Validator.isLowercase = Valid.match(/^[a-z0-9]+$/);
Validator.isUppercase = Valid.match(/^[A-Z0-9]+$/);
Validator.isInt = Valid.match(/^(?:-?(?:0|[1-9][0-9]*))$/);
Validator.isDecimal = Valid.match(/^(?:-?(?:0|[1-9][0-9]*))?(?:\.[0-9]*)?$/);
Validator.isFloat = Valid.isDecimal;
Validator.isNull = Valid.isNull;
Validator.notNull = Valid.not(Validator.isNull);
Validator.notEmpty Valid.nonBlank;
Validator.equals = Valid.todo;
Validator.contains = Valid.todo;  // if(this.str.indexOf(str) === -1) error('Invalid characters');
Validator.notContains = Valid.not(Validator.contains);
Validator.regex = Valid.match;
Validator.notRegex = Valid.not(Validator.regex);
Validator.len = Valid.todo;
Validator.isUUID = Valid.isUUID;
Validator.isDate = Valid.todo;
Validator.isAfter = Valid.todo;
Validator.isBefore = Valid.todo;
Validator.in = Valid.in;
Validator.notIn = Valid.not(Validator.in);
Validator.min = Valid.todo;
Validator.max = Valid.todo;
Validator.isArray = Valid.isArray;

Validator.check = function(str, fail_msg) {
  // Validator converts null and NaN to '', and numbers to strings.  Ugh.
  this.str = (str == null || (isNaN(str) && str.length == undefined)) ? '' : str;
  if (typeof this.str == 'number') this.str += '';
  return Valid.check(str);
}

/*     test the synopsis
var check = Validator.check;
check('test@email.com').len(6, 64).isEmail();        // Methods are chainable
check('abc').isInt();                                // Throws 'Invalid integer'
check('abc', 'Please enter a number').isInt();       // Throws 'Please enter a number'
check('abcdefghijklmnopzrtsuvqxyz').is(/^[a-z]+$/);
*/

