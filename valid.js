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

Valid.validate = function validate(value) {
    var self = this.GetChain();
    var error = self.ValidateQueue(self._queue, value);
    if(error && self._errorHandler) {
        return self._errorHandler(value, error);
    }
    return !error;
};


// custom error handlers

Valid.throwErrors = function throwErrors() {
    self = this.GetChain();
    self._errorHandler = function ThrowErrors(value, message) {
        throw value + " " + message;
    };
    return self;
};


// core tests

Valid.and = function and() {
    var chains = arguments;
    return this.GetChain().AddTest( function And(value) {
        for(var i=0; i<chains.length; i++) {
            var error = this.ValidateQueue(chains[i]._queue);
            if(error) return error;
        }
    });
};

Valid.equal = function equal(wanted) {
    return this.GetChain().AddTest( function Equal(value) {
        if(value !== wanted) return "doesn't equal " + wanted;
    });
};

//Valid.notEqual = Valid.not(Valid.equal);


Valid.typeOf = function typeOf(type) {
    return this.GetChain().AddTest(function TypeOf(value) {
        if(typeof value !== type) return "is of type " + (typeof value) + " not " + type;
    });
};

Valid.isUndefined   = Valid.equal(undefined);
Valid.isNull        = Valid.equal(null);       // in some js impls typeof null === 'object'
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

