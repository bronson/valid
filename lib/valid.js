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

// converts value into a string that can be printed
Valid.Escape = function Escape(value) {
    if(typeof value === 'string') {
        return '"' + value.replace(/[\\"]/g, '\\$&').replace(/\u0000/g, '\\0').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
    }
    return '' + value;
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
Valid.mod   = Valid.SimpleValidation(function mod(val,by,rem) { if(val%by !== (rem||0)) return "mod "+by+" must be "+rem+" not "+val%by; });
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
    if(arguments.length === 2) return "must equal " + opts[0];
    var lastopt = opts.pop();
    return "must be " + opts.join(", ") + " or " + lastopt;
});

Valid.oneOf = Valid.SimpleValidation(function OneOf(value,collection) {
    if(collection === null || collection === undefined) return "oneOf needs a collection";
    if(value in collection) return;
    return "is not an option";
});

Valid.type = Valid.SimpleValidation(function Type(value,type) {
    if(typeof type !== 'string') return "type requires a string argument, not "+(typeof type);
    if(typeof value !== type)    return "must be of type " + type + " not " + (typeof value);
});

Valid.array = Valid.SimpleValidation(function Arry(value, validation) {
    if(!Array.isArray(value)) return "must be an array";
    if(validation !== undefined) {
        for(var i=0; i<value.length; i++) {
            var error = this.ValidateQueue(validation._queue, value[i]);
            if(error) return "item " + i + " " + error;    // TODO: this sucks
        }
    }
});

Valid.date = Valid.SimpleValidation(function(value) {
    if(isNaN(Date.parse(value))) return "must be a date";
});

Valid.before = Valid.SimpleValidation(function Before(value,when) {
    if(when === undefined) when = new Date();
    if(Date.parse(value) > when) return "must be before " + when;
});

Valid.after = Valid.SimpleValidation(function After(value,when) {
    if(when === undefined) when = new Date();
    if(Date.parse(value) < when) return "must be after " + when;
});

Valid.len = Valid.SimpleValidation(function Len(value,min,max)  {
    var items = typeof value === 'string' ? 'character' : 'element';
    if(typeof value === 'null' || typeof value === 'undefined' || typeof value.length === 'undefined') return "must have a length field";
    if(typeof value.length !== 'number') return "must have a numeric length field, not " + (typeof value.length);
    // now we can read the property without risking throwing an exception
    if(value.length < min) return "is too short (minimum is " + min + " " + items + (min === 1 ? '' : 's') + ")";
    if(typeof max !== undefined) {
        if(value.length > max)  return "is too long (maximum is " + max + " " + items + (max === 1 ? '' : 's') + ")";
    }
});

Valid.message = function message(msg) {
    var validation = this.GetChain();
    return Valid.AddValidation(function Message(value) {
        var error = this.ValidateQueue(validation._queue, value);
        if(error) return validation._queue ? msg : error;
    }, msg);
};

Valid.not = Valid.SimpleValidation(function Not(value, validation, message) {
    var error = this.ValidateQueue(validation._queue, value);
    if(!error) return message || "validation must fail";
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
        return errors.length > 0 ? errors.join(" or ") : undefined;
    }, chains);
};

Valid.match = function match(pattern, modifiers) {
    if(typeof pattern !== 'function') pattern = new RegExp(pattern, modifiers);
    return this.string().AddValidation( function Match(value) {
        if(!value.match(pattern)) return "must match " + pattern;
    }, pattern);
};



// composite validations

Valid.undef      = Valid.equal(undefined).message("must be undefined").define();
Valid.defined    = Valid.not(Valid.undef(), "can't be undefined").define();
Valid.nil        = Valid.equal(null).message("must be null").define();
Valid.notNull    = Valid.not(Valid.nil(), "can't be null").define();
Valid.noexisty   = Valid.equal(undefined, null).message("must not exist").define();
Valid.exists     = Valid.not(Valid.noexisty(), "must exist").define();
Valid.empty      = Valid.len(0,0).message("must be empty").define();
Valid.number     = Valid.type('number').message("must be a number").define();
Valid.integer    = Valid.number().mod(1).message("must be an integer").define();
Valid.even       = Valid.number().mod(2).message("must be even").define();
Valid.odd        = Valid.number().mod(2,1).message("must be odd").define();
Valid.string     = Valid.type('string').message("must be a string").define();
Valid.blank      = Valid.optional().match(/^\s*$/).message("must be blank").define();
Valid.notBlank   = Valid.not(Valid.blank(), "can't be blank").define();
// reserved words, calling them with dot notation may cause problems with crappy JS implementations
Valid['undefined'] = Valid.undef;
Valid['null']      = Valid.nil;
Valid['in']        = Valid.oneOf;

// composites that take arguments
Valid.todo       = function(name) { return this.fail((name ? name : "validation") + " is still todo"); };
Valid.notEqual   = function(arg)  { return this.not(this.equal(arg), "can't equal " + this.Escape(arg)); };
Valid.nomatch    = function(pat,mods) { var match = this.match(pat,mods); return this.not(match, "can't match " + match._queue[1].data); };

// comparisons
Valid.eq   = Valid.equal;
Valid.ne   = Valid.notEqual;
Valid.lt   = Valid.SimpleValidation(function lt(val,than) { if(val >= than) return "must be less than " + Valid.Escape(than); });
Valid.le   = Valid.SimpleValidation(function le(val,than) { if(val >  than) return "must be less than or equal to " + Valid.Escape(than); });
Valid.gt   = Valid.SimpleValidation(function gt(val,than) { if(val <= than) return "must be greater than " + Valid.Escape(than); });
Valid.ge   = Valid.SimpleValidation(function ge(val,than) { if(val <  than) return "must be greater than or equal to " + Valid.Escape(than); });
Valid.min  = Valid.ge;
Valid.max  = Valid.le;



// JSON Schema

Valid.JsonError = function(path, message) {
    var error = this._errors;
    var last = path.length - 1;
    var key = path.length === 0 ? '.' : path[last];

    for(var i=0; i<last; i++) {
        if(!error[path[i]]) error[path[i]] = {};
        error = error[path[i]];
    }

    error[key] = message;
    this._errorCount += 1;
};


Valid.JsonObject = function(path, value, schema, strict) {
    // if strict is true, all keys in value must be named in schema.
    if(typeof value !== 'object') {
        this.JsonError(path, "must be an object");
        return;
    }

    for(var key in schema) {
        if(!schema.hasOwnProperty(key)) continue;
        if(key in value) {
            this.JsonField(path.concat(key), value[key], schema[key]);
        } else {
            this.JsonError(path, "must include " + key);
        }
        if(this._errorCount > this._maxErrors) break;
    }

    if(strict) for(key in value) {
        if(!value.hasOwnProperty(key)) continue;
        if(!(key in schema)) this.JsonError(path, "can't include " + key);
        if(this._errorCount > this._maxErrors) break;
    }
};


Valid.JsonField = function(path, value, schema) {
    // need to duck type RegExps because instanceof isn't working reliably
    var isRegExp = function(o) { return o && o.test && o.exec && o.source && (o.global === true || o.global === false) && (o.ignoreCase === true || o.ignoreCase === false) && (o.multiline === true || o.multiline === false); };

    switch(typeof schema) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'undefined':
        if(value !== schema) this.JsonError(path, "must equal " + this.Escape(schema));
        break;

        case 'null':         // usually typeof null === 'object'
        case 'object':
        case 'function':     // seems random what impls return for built-in objects
        if(schema === null) {
            if(value !== null) this.JsonError(path, "must be null");
        } else if(schema._queue && typeof schema.GetChain === 'function') {   // try to detect a Valid chain
            var vresult = schema.check(value);
            if(vresult) this.JsonError(path, vresult);
        } else if(value === null) {
            this.JsonError(path, "can't be null");
        } else if(isRegExp(schema)) {
            var reresult = Valid.match(schema).check(value);
            if(reresult) this.JsonError(path, reresult);
        } else if(schema instanceof Array) {
            if(value instanceof Array) {
                if(value.length !== schema.length) this.JsonError(path, " must have " + value.length + " items, not " + schema.length);
                for(var i=0; i < schema.length; i++) {
                    this.JsonField(path.concat(i), value[i], schema[i]);
                    if(this._errorCount > this._maxErrors) break;
                }
            } else {
                this.JsonError(path, "must be an array");
            }
        } else if(typeof schema === 'function') {
            var fresult = schema.call(this, value);
            if(fresult) this.JsonError(path, fresult);
        } else {
            this.JsonObject(path, value, schema, false);
        }
        break;

        default:
        this.JsonError(path, "Error in template: what is " + (typeof schema) + "?");
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

