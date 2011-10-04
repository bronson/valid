// valid.js     http://github.com/bronson/valid.js
//
// A simple, chainable validation library under the MIT license.
// Works in Node, the browser, and anywhere JavaScript should run.


var Valid = function Valid() { };
module.exports = Valid;


// Internals
// ---------

Valid.GetChain = function GetChain() {
    if(this === Valid) {
        // we're the first item in a chain so create a Chain object
        var chain = function Chain() {};
        chain.prototype = this;
        return new chain();
    }
    return this;
};

// Adds the given validation to the current Chain.
// Data is optional but can help identify the validation when debugging.
Valid.AddValidation = function AddValidation(validation, data) {
    var self = this.GetChain();
    if(self._queue === undefined) self._queue = [];
    if(data) validation.data = data;
    self._queue.push(validation);
    return self;
};

// Supply a function that that returns undefined on success or an error message on failure, produces a full, chainable validation.
// The first arg passed to your your function is the value to test, the rest are the args passed when declaring the validation.
// i.e. Valid.t = SimpleValidation(fn(){...}); Valid.t(4,2).check(9) would call your function with arguments 9, 4, 2.
Valid.SimpleValidation = function SimpleValidation(fn) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        return this.AddValidation( function SimpleValidation(value) {
            return fn.apply(this, [value].concat(args));
        }, args);
    };
};

// Run all the validations in the given queue
Valid.ValidateQueue = function ValidateQueue(queue, value) {
    if(!queue || queue.length < 1) return "no validations!";
    for(var i=0; i<queue.length; i++) {
        var error = queue[i].call(this, value);
        if(error === Valid) return; // indicates early success, used by optional()
        if(error) return error;
    }
};

Valid.Escape = function Escape(value) {
    // todo: escape \n, \t, \\, \' and \" in the printed strings
    if(typeof value === 'string') return "'" + value.substring(0,20) + "'";
    return value;
};


// Turns a Chain object into a callable Validation.
//   Valid.isFour = Valid.equal(4).define();    // define the isFour validation
//   Valid.integer().isFour().isValid(4);       // true!
// If you get this error then you forgot to call define() on your chain:
//   Property 'myfunc' of object function Valid() { } is not a function
// It's really shameful that this function needs to exist.
// In an ideal world you could just do this:  Valid.null() = Valid.equal(null);
// In our world, that only works if you don't call it: Valid.null.check(1);  Ugh.
// Since Valid.equal(null) returns the chain object, if you call null:
//   Valid.null().check(1) JS complains "Property null is not a function"
// For this to work, JS needs to a callable object with a prototype chain.
// And, without using nonstandard __proto__, I don't think that's possible...?
Valid.define = function define() {
    var queue = this._queue;
    return function() {
        var self = this.GetChain();
        for(var i=0; i<queue.length; i++) {
            self.AddValidation(queue[i]);
        }
        return self;
    };
};



// User-facing API
// ---------------

// results

// returns the error string or undefined if there were no validation errors
Valid.check = function check(value) {
    var self = this.GetChain();
    return self.GetChain().ValidateQueue(self._queue, value);
};

// returns true if the validation succeeded, false if there were errors
Valid.isValid = function isValid(value) {
    return !this.check(value);
};


// core validations

Valid.nop   = Valid.SimpleValidation(function Nop(val)        { });
Valid.fail  = Valid.SimpleValidation(function Fail(val,msg)   { return msg || "failed"; });
Valid.mod   = Valid.SimpleValidation(function mod(val,by,rem) { if(val%by !== (rem||0)) return "mod "+by+" is "+(val%by)+" not "+rem; });
Valid.optional = Valid.SimpleValidation(function Optional(value) { if(value === null || value === undefined) return Valid; });

Valid.equal = Valid.SimpleValidation(function Equal(value) {
    // Here is the old equal, not sure supporting multiple values is worth the additional complexity...
    // Valid.equal = Valid.SimpleValidation(function Equal(val,want) { if(val !== want) return "is not equal to "+Valid.Escape(want); });
    if(arguments.length === 1) return "equal needs at least one argument";
    var opts = [];
    for(var i=1; i<arguments.length; i++) {
        if(value === arguments[i]) return;
        opts.push(this.Escape(arguments[i]));
    }
    if(arguments.length === 2) return "is not equal to " + opts[0];
    var lastopt = opts.pop();
    return "is not " + opts.join(", ") + " or " + lastopt;
});

Valid.oneOf = Valid.SimpleValidation(function OneOf(value,collection) {
    if(collection === null || collection === undefined) return "oneOf needs a collection";
    if(value in collection) return;
    return "is not one of the options";
});

Valid.type = Valid.SimpleValidation(function Type(value,type) {
    if(typeof type !== 'string') return "type requires a string argument, not "+(typeof type);
    if(typeof value !== type)      return "is of type " + (typeof value) + " not " + type;
});

Valid.array = Valid.SimpleValidation(function Arry(value, validation) {
    if(!Array.isArray(value)) return "is not an array";
    if(validation !== undefined) {
        for(var i=0; i<value.length; i++) {
            var error = this.ValidateQueue(validation._queue, value[i]);
            if(error) return "item " + i + " " + error;
        }
    }
});

Valid.len = Valid.SimpleValidation(function Len(value,min,max)  {
    if(typeof value === 'null' || typeof value === 'undefined' || typeof value.length === 'undefined') return "doesn't have a length field";
    if(typeof value.length !== 'number') return "length field is of type " + (typeof value.length) + ", not number";
    // now we can read the property without risking throwing an exception
    if(value.length < min) return "has length " + value.length + ", less than " + min;
    if(typeof max !== undefined) {
        if(value.length > max)  return "has length " + value.length + ", greater than " + max;
    }
});

Valid.message = function message(msg) {
    var validation = this.GetChain();
    return Valid.AddValidation(function Message(value) {
        var error = this.ValidateQueue(validation._queue, value);
        if(error) return validation._queue ? msg : error;
    }, msg);
}

Valid.not = Valid.SimpleValidation(function Not(value, validation, message) {
    var error = this.ValidateQueue(validation._queue, value);
    if(!error) return message || "validation should have failed";
});

// seems somewhat useless since V.a().b() is the same as V.and(V.a(),V.b())
Valid.and = function and() {
    var chains = arguments;
    return this.AddValidation( function And(value) {
        for(var i=0; i<chains.length; i++) {
            var error = this.ValidateQueue(chains[i]._queue, value);
            if(error) return error;
        }
    }, chains);
};

Valid.or = function or() {
    var chains = arguments;
    return this.AddValidation(function Or(value) {
        var errors = [];
        for(var i=0; i<chains.length; i++) {
            var error = this.ValidateQueue(chains[i]._queue, value);
            if(!error) return;   // short circuit
            errors.push(error);
        }
        return errors.length > 0 ? errors.join(" and ") : undefined;
    }, chains);
};

Valid.match = function match(pattern, modifiers) {
    if(typeof pattern !== 'function') pattern = new RegExp(pattern, modifiers);
    return this.string().AddValidation( function Match(value) {
        if(!value.match(pattern)) return "does not match " + pattern;
    }, pattern);
};



// composite validations

Valid.undef      = Valid.equal(undefined).define();
Valid.defined    = Valid.not(Valid.undef(), "is undefined").define();
Valid.nil        = Valid.equal(null).define();
Valid.notNull    = Valid.not(Valid.nil(), "is null").define();
Valid.noexisty   = Valid.equal(undefined, null).define();
Valid.exists     = Valid.not(Valid.noexisty(), "does not exist").define();
Valid.empty      = Valid.len(0,0).message("should be empty").define();
Valid.boolean    = Valid.type('boolean').define();
Valid.isTrue     = Valid.equal(true).define();
Valid.isFalse    = Valid.equal(false).define();
Valid.number     = Valid.type('number').define();
Valid.integer    = Valid.number().mod(1).message("is not an integer").define();
Valid.even       = Valid.number().mod(2).message("is not even").define();
Valid.odd        = Valid.number().mod(2,1).message("is not odd").define();
Valid.string     = Valid.type('string').define();
Valid.blank      = Valid.optional().match(/^\s*$/).message("is not blank").define();
Valid.notBlank   = Valid.not(Valid.blank(), "is blank").define();
Valid.object     = Valid.type('object').define();
// reserved words, calling them with dot notation may cause problems with crappy JS implementations
Valid['undefined'] = Valid.undef;
Valid['null']      = Valid.nil;
Valid['true']      = Valid.isTrue;
Valid['false']     = Valid.isFalse;
Valid['in']        = Valid.oneOf;

// composites that take arguments
Valid.todo       = function(name) { return this.fail((name ? name : "this") + " is still todo"); };
Valid.notEqual   = function(arg)  { return this.not(this.equal(arg), "is equal to " + this.Escape(arg)); };
Valid.nomatch    = function(pat,mods) { var match = this.match(pat,mods); return this.not(match, "matches " + match._queue[1].data); };

// comparisons
Valid.eq   = Valid.equal;
Valid.ne   = Valid.notEqual;
Valid.lt   = Valid.SimpleValidation(function lt(val,than) { if(val >= than) return "is not less than " + Valid.Escape(than); });
Valid.le   = Valid.SimpleValidation(function le(val,than) { if(val >  than) return "is not less than or equal to " + Valid.Escape(than); });
Valid.gt   = Valid.SimpleValidation(function gt(val,than) { if(val <= than) return "is not greater than " + Valid.Escape(than); });
Valid.ge   = Valid.SimpleValidation(function ge(val,than) { if(val <  than) return "is not greater than or equal to " + Valid.Escape(than); });
Valid.min  = Valid.ge;
Valid.max  = Valid.le;



// JSON Schema

Valid.JsonError = function(path, value, message) {
    var str = '';
    for(var i=0; i<path.length; i++) {
        str += Valid.integer().isValid(path[i]) ? '['+path[i]+']' : (str === '' ? '' : '.') + path[i];
    }
    if(str === '') str = '.';

    if(this._errors[str]) return;  // ignore duplicate errors
    this._errors[str] = {value: value, message: message};
    this._errorCount += 1;
};


Valid.JsonObject = function(path, value, schema) {
    for(var key in schema) {
        if(!schema.hasOwnProperty(key)) continue;
        if(key in value) {
            this.JsonField(path.concat(key), value[key], schema[key]);
        } else {
            this.JsonError(path, value, "is missing " + key);
        }
        if(this._errorCount > this._maxErrors) break;
    }

    for(key in value) {
        if(!value.hasOwnProperty(key)) continue;
        if(!(key in schema)) this.JsonError(path, value, "shouldn't have " + key);
        if(this._errorCount > this._maxErrors) break;
    }
};


Valid.JsonField = function(path, value, schema) {
    switch(typeof schema) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'undefined':
        if(value !== schema) this.JsonError(path, value, "does not equal " + this.Escape(schema));
        break;

        case 'function':
        if(schema instanceof RegExp) {
            var reresult = Valid.match(schema).check(value);
            if(reresult) this.JsonError(path, value, reresult);
        } else {
            var fresult = schema.call(this, value);
            if(fresult) this.JsonError(path, value, fresult);
        }
        break;

        case 'null':
        case 'object':
        if(schema === null) {
            if(value !== null) this.JsonError(path, value, "is not null");
        } else if(schema._queue && typeof schema.GetChain === 'function') {   // try to detect a Valid chain
            var vresult = schema.check(value);
            if(vresult) this.JsonError(path, value, vresult);
        } else if(value === null) {
            this.JsonError(path, value, "is null");
        } else if(schema instanceof Array) {
            if(value instanceof Array) {
                if(value.length !== schema.length) this.JsonError(path, value, " has " + value.length + " items, not " + schema.length);
                for(var i=0; i < schema.length; i++) {
                    this.JsonField(path.concat(i), value[i], schema[i]);
                    if(this._errorCount > this._maxErrors) break;
                }
            } else {
                this.JsonError(path, value, "is not an Array");
            }
        } else {
            this.JsonObject(path, value, schema);
        }
        break;

        default:
        this.JsonError(path, value, "Error in template: what is " + (typeof schema) + "?");
    }
};


Valid.json = function json(schema) {
    return this.AddValidation(function Json(value, maxErrors) {
        this._errors = {};
        this._errorCount = 0;
        this._maxErrors = maxErrors || 20;
        this.JsonField([], value, schema, {});
        if(this._errorCount > 0) return this._errors;
    }, schema);
};

