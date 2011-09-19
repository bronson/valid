// valid.js Scott Bronson 2011
// This file defines the Valid object and some core validation tests.

// todo? type instead of typeOf   boolean instead of isBoolean

var Valid = function Valid() { };
module.exports = Valid;


Valid.GetChain = function GetChain() {
    if(this === Valid) {
        // we're the first item in a chain so create a Chain object
        var chain = function Chain() {};
        chain.prototype = this;
        return new chain();
    }
    return this;
};

// Adds the given test to the current Chain.
// If data is supplied, it's added to the passed-in test to help introspect when debugging.
Valid.AddTest = function AddTest(test, data) {
    var self = this.GetChain();
    if(self._queue === undefined) self._queue = [];
    if(data) test.data = data;
    self._queue.push(test);
    return self;
};

// Supply a function that that returns undefined on success or an error message on failure, produces a full, chainable test.
// The first arg passed to your your function is the value to test, the rest are the args passed when adding the test.
// i.e. Valid.t = SimpleTest(fn(){...}); Valid.t(4,2).check(9) would call your function with arguments 9, 4, 2.
Valid.SimpleTest = function SimpleTest(fn) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        return this.AddTest( function SimpleTest(value) {
            return fn.apply(this, [value].concat(args));
        }, args);
    };
};

Valid.ValidateQueue = function ValidateQueue(queue, value) {
    if(!queue || queue.length < 1) return "no tests!";
    for(var i=0; i<queue.length; i++) {
       var error = queue[i].call(this, value);
        if(error) return error;
    }
};


// core api
//     TODO: test?  check?  verify?  these names suck.

// returns null if valid, the error string if invalid
Valid.test = function test(value) {
    var self = this.GetChain();
    return self.GetChain().ValidateQueue(self._queue, value);
};

// returns true if valid, false if invalid
Valid.check = function check(value) {
    return !this.test(value);
};

// raises an error if invalid
Valid.verify = function assert(value) {
    var message = this.test(value);
    if(message) throw value + " " + message;
};

// It's really shameful that this function needs to exist.
// In an ideal world you could just do this:  Valid.isNull() = Valid.equal(null);
// In our world, that only works if you don't call it: Valid.isNull.verify(1);  Ugh.
// Since Valid.equal(null) returns the chain object, if you call isNull:
//   Valid.isNull().verify(1) JS complains "Property isNull is not a function"
// For this to work, JS needs to a callable object with a prototype chain.
// And, without using nonstandard __proto__, I don't think that's possible...?
Valid.define = function define() {
    var queue = this._queue;
    return function() {
        var self = this.GetChain();
        for(i=0; i<queue.length; i++) {
            self.AddTest(queue[i]);
        }
        return self;
    };
};


// core tests

Valid.nop   = Valid.SimpleTest(function Nop(val)        { });
Valid.fail  = Valid.SimpleTest(function Fail(val,msg)   {                         return msg || "failed"; });
Valid.equal = Valid.SimpleTest(function Equal(val,want) { if(val !== want)        return "doesn't equal "+want; });
Valid.mod   = Valid.SimpleTest(function mod(val,by,rem) { if(val%by !== (rem||0)) return "mod "+by+" is "+(val%by)+" not "+rem; });

Valid.typeOf= Valid.SimpleTest(function Type(val,type)  {
    if(typeof type !== 'string') return "typeOf requires a string argument, not "+(typeof type);
    if(typeof val !== type)      return "is of type " + (typeof val) + " not " + type;
});

Valid.messageFor = Valid.SimpleTest(function Msg(value, test, message) {
    var error = this.ValidateQueue(test._queue, value);
    if(error) return message;
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
    return this.isString().AddTest( function Match(value) {
        if(!value || !value.match(pattern)) return "doesn't match " + pattern;
    });
};


// composite tests

Valid.todo = function(name) {
    return this.fail((name ? name : "this") + " is still todo");
};

Valid.not = Valid.todo;

Valid.isUndefined   = Valid.equal(undefined).define();
//Valid.isDefined     = Valid.not(Valid.isUndefined()).define();
Valid.isNull        = Valid.equal(null).define();
//Valid.nonNull       = Valid.not(Valid.isNull()).define();
//Valid.exists        = Valid.isDefined().nonNull().define();
Valid.isBoolean     = Valid.typeOf('boolean').define();
Valid.isTrue        = Valid.equal(true).define();
Valid.isFalse       = Valid.equal(false).define();
Valid.isNumber      = Valid.typeOf('number').define();
Valid.isInteger     = Valid.isNumber().messageFor(Valid.mod(1), "is not an integer").define();
Valid.isString      = Valid.typeOf('string').define();
//Valid.nonBlank      = Valid.not(Valid.match(/^\s*$/)).define();
Valid.isFunction    = Valid.typeOf('function').define();
Valid.isObject      = Valid.typeOf('object').define();

Valid.optional = function(test) { return Valid.or( Valid.messageFor(Valid.isUndefined(),"is optional"), test); };
Valid.notEqual = function(arg) { return Valid.not(Valid.equal(arg)); };

