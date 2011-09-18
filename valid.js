// valid.js Scott Bronson 2011
// This file defines the Valid object and some core validation tests.

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

Valid.AddTest = function AddTest(test, data) {
    if(this._queue === undefined) this._queue = [];
    // data is optional but, if supplied, it gets added to the function object
    // this helps investigate deep test chains when debugging
    if(data) test.data = data;
    this._queue.push(test);
    return this;
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
// In this world, that only works if you don't call it:   Valid.isNull.verify(1)
// Since Valid.equal(null) returns the chain object, if you call isNull:
//   Valid.isNull().verify(1)   complains "Property isNull is not a function"
// For this to work, JS needs to a callable object with a prototype chain.
// And, without using nonstandard __proto__, I don't see how to make that happen.
Valid.define = function define() {
    var queue = this._queue;
    return function() {
        self = this.GetChain();
        for(i=0; i<queue.length; i++) {
            self.AddTest(queue[i]);
        }
        return self;
    };
};


// core tests

Valid.nop = function() { return this.GetChain().AddTest(function Nop(value) {}); };

Valid.fail = function fail(message) {
    return this.GetChain().AddTest( function Fail(value) {
        return message || "failed";
    });
};

Valid.TODO = function(name) {
    return this.fail((name ? name : "this") + " is still todo");
};

Valid.equal = function equal(wanted) {
    return this.GetChain().AddTest( function Equal(value) {
        if(value !== wanted) return "doesn't equal " + wanted;
    });
};

Valid.mod = function mod(by, remainder) {
    if(!remainder) remainder = 0;
    return this.GetChain().AddTest( function Mod(value) {
        if(value % by !== remainder) return "mod " + by + " has " + (value % by) + " remainder instead of " + remainder;
    });
};

Valid.typeOf = function typeOf(type) {
    if(typeof type != 'string') return this.fail("typeOf requires a string argument, not type " + typeof type);
    return this.GetChain().AddTest(function TypeOf(value) {
        if(typeof value !== type) return "is of type " + (typeof value) + " not " + type;
    });
};

// seems somewhat useless since V.and(V.a(),V.b()) is the same as V.a().b()
Valid.and = function and() {
    var chains = arguments;
    return this.GetChain().AddTest( function And(value) {
        for(var i=0; i<chains.length; i++) {
            var error = this.ValidateQueue(chains[i]._queue, value);
            if(error) return error;
        }
    }, chains);
};

Valid.or = function or() {
    var chains = arguments;
    return this.GetChain().AddTest(function Or(value) {
        var errors = [];
        for(var i=0; i<chains.length; i++) {
            var error = this.ValidateQueue(chains[i]._queue, value);
            if(!error) return;
            errors.push(error);
        }
        return errors.length > 0 ? errors.join(" and ") : undefined;
    }, chains);
};

Valid.not = Valid.TODO;

Valid.optional = Valid.TODO;

Valid.errorMessage = function errorMessage(test, message) {
    return this.GetChain().AddTest( function ErrorMessage(value) {
        var error = this.ValidateQueue(test._queue, value);
        if(error) return message;
    });
};


// composite tests
Valid.notEqual = function(arg) { return Valid.not(Valid.equal(arg)); };
Valid.isUndefined   = Valid.equal(undefined).define();
//Valid.isDefined     = Valid.not(Valid.isUndefined()).define();
Valid.isNull        = Valid.equal(null).define();
//Valid.nonNull       = Valid.not(Valid.isNull()).define();
//Valid.exists        = Valid.isDefined().nonNull().define();
Valid.isBoolean     = Valid.typeOf('boolean').define();
Valid.isTrue        = Valid.equal(true).define();
Valid.isFalse       = Valid.equal(false).define();
Valid.isNumber      = Valid.typeOf('number').define();
Valid.isInteger     = Valid.isNumber().errorMessage(Valid.mod(1), "is not an integer").define();
Valid.isString      = Valid.typeOf('string').define();
//Valid.nonBlank      = Valid.not(Valid.match(/^\s*$/)).define();
Valid.isFunction    = Valid.typeOf('function').define();
Valid.isObject      = Valid.typeOf('object').define();

Valid.match = function match(pattern, modifiers) {
    if(typeof pattern !== 'function') pattern = new RegExp(pattern, modifiers);
    return this.isString().AddTest( function Match(value) {
        if(!value || !value.match(pattern)) return "doesn't match " + pattern;
    });
};

