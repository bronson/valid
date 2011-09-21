// valid.js
// This file contains the default Valid tests but not the JSON schema verifier.

var Valid = require('./valid-engine');
module.exports = Valid;


// results

Valid.test = function test(value) {
    var self = this.GetChain();
    return self.GetChain().ValidateQueue(self._queue, value);
};

Valid.check = function check(value) {
    return !this.test(value);
};

Valid.verify = function assert(value) {
    var message = this.test(value);
    if(message) throw value + " " + message;
};


// core tests

Valid.nop   = Valid.SimpleTest(function Nop(val)        { });
Valid.fail  = Valid.SimpleTest(function Fail(val,msg)   { return msg || "failed"; });
Valid.mod   = Valid.SimpleTest(function mod(val,by,rem) { if(val%by !== (rem||0)) return "mod "+by+" is "+(val%by)+" not "+rem; });
Valid.optional = Valid.SimpleTest(function Optional(value) { if(value === null || value === undefined) return Valid; });

Valid.equal = Valid.SimpleTest(function Equal(value) {
    // Here is the old equal, not sure supporting multiple values is worth the additional complexity...
    // Valid.equal = Valid.SimpleTest(function Equal(val,want) { if(val !== want) return "is not equal to "+Valid.Escape(want); });
    if(arguments.length === 1) return "equal needs at least one argument";
    var opts = [];
    for(var i=1; i<arguments.length; i++) {
        if(value === arguments[i]) return;
        opts.push(Valid.Escape(arguments[i]));
    }
    if(arguments.length === 2) return "is not equal to " + opts[0];
    var lastopt = opts.pop();
    return "is not " + opts.join(", ") + " or " + lastopt;
});

Valid.oneOf = Valid.SimpleTest(function OneOf(value,collection) {
    if(collection === null || collection === undefined) return "oneOf needs a collection";
    if(value in collection) return;
    return "is not one of the options";
});

Valid.type = Valid.SimpleTest(function Type(value,type) {
    if(typeof type !== 'string') return "type requires a string argument, not "+(typeof type);
    if(typeof value !== type)      return "is of type " + (typeof value) + " not " + type;
});

Valid.array = Valid.SimpleTest(function Arry(value, test) {
    if(!Array.isArray(value)) return "is not an array";
    if(test !== undefined) {
        for(var i=0; i<value.length; i++) {
            var error = this.ValidateQueue(test._queue, value[i]);
            if(error) return "item " + i + " " + error;
        }
    }
});

Valid.len = Valid.SimpleTest(function Len(value,min,max)  {
    if(typeof value === 'null' || typeof value === 'undefined' || typeof value.length === 'undefined') return "doesn't have a length field";
    if(typeof value.length !== 'number') return "length field is of type " + (typeof value.length) + ", not number";
    // now we can read the property without risking throwing an exception
    if(value.length < min) return "has length " + value.length + ", less than " + min;
    if(typeof max !== undefined) {
        if(value.length > max)  return "has length " + value.length + ", greater than " + max;
    }
});

Valid.messageFor = Valid.SimpleTest(function Msg(value, test, message) {
    var error = this.ValidateQueue(test._queue, value);
    if(error) return message;
});

Valid.not = Valid.SimpleTest(function Not(value, test, message) {
    var error = this.ValidateQueue(test._queue, value);
    if(!error) return message || "test should have failed";
});

// seems somewhat useless since V.a().b() is the same as V.and(V.a(),V.b())
Valid.and = function and() {
    var chains = arguments;
    return this.AddTest( function And(value) {
        for(var i=0; i<chains.length; i++) {
            var error = this.ValidateQueue(chains[i]._queue, value);
            if(error) return error;
        }
    }, chains);
};

Valid.or = function or() {
    var chains = arguments;
    return this.AddTest(function Or(value) {
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
    return this.string().AddTest( function Match(value) {
        if(!value.match(pattern)) return "does not match " + pattern;
    }, pattern);
};



// composite tests

Valid.undef      = Valid.equal(undefined).define();
Valid.defined    = Valid.not(Valid.undef(), "is undefined").define();
Valid.nil        = Valid.equal(null).define();
Valid.notNull    = Valid.not(Valid.nil(), "is null").define();
Valid.noexisty   = Valid.equal(undefined, null).define();
Valid.exists     = Valid.not(Valid.noexisty(), "does not exist").define();
Valid.empty      = Valid.messageFor(Valid.optional().len(0,0), "is not empty").define();
Valid.boolean    = Valid.type('boolean').define();
Valid.number     = Valid.type('number').define();
Valid.integer    = Valid.number().messageFor(Valid.mod(1), "is not an integer").define();
Valid.string     = Valid.type('string').define();
Valid.blank      = Valid.messageFor(Valid.optional().match(/^\s*$/), "is not blank").define();
Valid.notBlank   = Valid.not(Valid.blank(), "is blank").define();
Valid.object     = Valid.type('object').define();

// reserved words, calling them with dot notation may cause problems with crappy JS impls
Valid['undefined'] = Valid.undef;
Valid['null']      = Valid.nil;
Valid['true']      = Valid.equal(true).define();
Valid['false']     = Valid.equal(false).define();
Valid['function']  = Valid.type('function').define();
Valid['in']        = Valid.oneOf;
Valid.length       = Valid.len;

Valid.todo       = function(name) { return this.fail((name ? name : "this") + " is still todo"); };
Valid.notEqual   = function(arg)  { return Valid.not(Valid.equal(arg), "is equal to " + Valid.Escape(arg)); };
Valid.nomatch    = function(pat,mods) { var match = Valid.match(pat,mods); return Valid.not(match, "matches " + match._queue[1].data); };

Valid.eq   = Valid.equal;
Valid.ne   = Valid.notEqual;
Valid.lt   = Valid.SimpleTest(function lt(val,than) { if(val >= than) return "is not less than " + Valid.Escape(than); });
Valid.le   = Valid.SimpleTest(function le(val,than) { if(val >  than) return "is not less than or equal to " + Valid.Escape(than); });
Valid.gt   = Valid.SimpleTest(function gt(val,than) { if(val <= than) return "is not greater than " + Valid.Escape(than); });
Valid.ge   = Valid.SimpleTest(function ge(val,than) { if(val <  than) return "is not greater than or equal to " + Valid.Escape(than); });
Valid.min  = Valid.ge;
Valid.max  = Valid.le;

