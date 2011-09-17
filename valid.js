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

// Valid.or
// Valid.not

Valid.todo = Valid.fail(" is still todo");

//Valid.notEqual = Valid.not(Valid.equal);
// Some JS implementations think typeof null === 'object'
Valid.isUndefined   = Valid.equal(undefined);
Valid.isNull        = Valid.equal(null);
Valid.isBoolean     = Valid.typeOf('boolean');
Valid.isNumber      = Valid.typeOf('number');
Valid.isString      = Valid.typeOf('string');
Valid.isFunction    = Valid.typeOf('function');
Valid.isObject      = Valid.typeOf('object');

Valid.match = function match(pattern, modifiers) {
    if(typeof pattern !== 'function') pattern = new RegExp(pattern, modifiers);
    return this.GetChain().AddTest( function Match(value) {
        if(!value.match(pattern)) return "doesn't match " + pattern;
    });
};

