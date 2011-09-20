// valid.js Scott Bronson 2011
// This file defines the Valid object and some core validation tests.

// todo? is it possible to turn test objects into arrays?

var Valid = require('./valid-engine');
module.exports = Valid;


// core tests

Valid.nop   = Valid.SimpleTest(function Nop(val)        { });
Valid.fail  = Valid.SimpleTest(function Fail(val,msg)   {                         return msg || "failed"; });
Valid.equal = Valid.SimpleTest(function Equal(val,want) { if(val !== want)        return "is not equal to "+want; });
Valid.mod   = Valid.SimpleTest(function mod(val,by,rem) { if(val%by !== (rem||0)) return "mod "+by+" is "+(val%by)+" not "+rem; });

Valid.type  = Valid.SimpleTest(function Type(val,type)  {
    if(typeof type !== 'string') return "type requires a string argument, not "+(typeof type);
    if(typeof val !== type)      return "is of type " + (typeof val) + " not " + type;
});

Valid.messageFor = Valid.SimpleTest(function Msg(value, test, message) {
    var error = this.ValidateQueue(test._queue, value);
    if(error) return message;
});

Valid.not = Valid.SimpleTest(function Not(value, test, message) {
    var error = this.ValidateQueue(test._queue, value);
    if(!error) return message || "test succeeded";
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
    });
};


// composite tests

Valid.todo = function(name) {
    return this.fail((name ? name : "this") + " is still todo");
};

Valid.undefined  = Valid.equal(undefined).define();
Valid.defined    = Valid.not(Valid.undefined(), "is undefined").define();
Valid.null       = Valid.equal(null).define();
Valid.notNull    = Valid.not(Valid.null(), "is null").define();
Valid.exists     = Valid.messageFor(Valid.defined().notNull(), "does not exist").define();
Valid.noexisty   = Valid.not(Valid.exists(), "exists").define();
Valid.boolean    = Valid.type('boolean').define();
Valid.true       = Valid.equal(true).define();
Valid.false      = Valid.equal(false).define();
Valid.number     = Valid.type('number').define();
Valid.integer    = Valid.number().messageFor(Valid.mod(1), "is not an integer").define();
Valid.string     = Valid.type('string').define();
Valid.blank      = Valid.messageFor(Valid.or(Valid.noexisty(),Valid.match(/^\s*$/)), "is not blank").define();
Valid.notBlank   = Valid.not(Valid.blank(), "is blank").define();
Valid.function   = Valid.type('function').define();
Valid.object     = Valid.type('object').define();

Valid.optional   = function(test) { return Valid.or(Valid.messageFor(Valid.undefined(),"is optional"), test); };
Valid.notEqual   = function(arg) { return Valid.not(Valid.equal(arg), "is equal to " + arg); };

