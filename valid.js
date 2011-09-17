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

Valid.AddTest = function AddTest(test) {
    if(this._queue === undefined) this._queue = [];
    this._queue.push(test);
    return this;
};

Valid.ValidateQueue = function ValidateQueue(queue, value) {
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
    return !this.test();
}

// raises an error if invalid
Valid.verify = function assert(value) {
    var message = this.test(value);
    if(message) throw value + " " + message;
}

// It's really shameful that this function needs to exist.
// In an ideal world you could just do this:  Valid.isNull() = Valid.equal(null);
// In this world, that only works if you don't call it:   Valid.isNull.verify(1)
// Since Valid.equal(null) returns the chain object, if you call isNull:
//   Valid.isNull().verify(1)   complains "Property isNull is not a function"
// For this to work, JS needs to a callable object with a prototype chain.
// And, without using nonstandard __proto__, I don't see how to make that happen.
Valid.define = function define() {
    var that = this;
    return function() { return that; };
}


// core tests

// always fails validation
Valid.fail = function fail(message) {
    return this.GetChain().AddTest( function Fail(value) {
        return message || "failed";
    });
};

Valid.equal = function equal(wanted) {
    return this.GetChain().AddTest( function Equal(value) {
        if(value !== wanted) return "doesn't equal " + wanted;
    });
};

Valid.typeOf = function typeOf(type) {
    return this.GetChain().AddTest(function TypeOf(value) {
        if(typeof value !== type) return "is of type " + (typeof value) + " not " + type;
    });
};

Valid.and = function and() {
    var chains = arguments;
    return this.GetChain().AddTest( function And(value) {
        for(var i=0; i<chains.length; i++) {
            var error = this.ValidateQueue(chains[i]._queue);
            if(error) return error;
        }
    });
};

Valid.TODO = function(name) {
    return Valid.fail((name ? name : "this") + " is still todo")
};

Valid.or = Valid.TODO("or").define();
Valid.not = Valid.TODO;

Valid.notEqual = function(arg) { return Valid.not(Valid.equal(arg)) }

// Some JS implementations think typeof null === 'object'
Valid.isUndefined   = Valid.equal(undefined).define();
Valid.isNull        = Valid.equal(null).define();
Valid.isBoolean     = Valid.typeOf('boolean').define();
Valid.isNumber      = Valid.typeOf('number').define();
Valid.isString      = Valid.typeOf('string').define();
Valid.isFunction    = Valid.typeOf('function').define();
Valid.isObject      = Valid.typeOf('object').define();

Valid.match = function match(pattern, modifiers) {
    if(typeof pattern !== 'function') pattern = new RegExp(pattern, modifiers);
    return this.isString().AddTest( function Match(value) {
        if(!value || !value.match(pattern)) return "doesn't match " + pattern;
    });
};

