// valid.js Scott Bronson 2011
// This file defines the Valid object and some core validation tests.

var Valid = function Valid() { };
module.exports = Valid;


//              internals

Valid.GetChain = function GetChain() {
    if(this === Valid) {
        // we're the first item in a chain so create a Chain object
        var chain = function Chain() {};
        chain.prototype = this;
        return new chain();
    }
    return this;
};


Valid.ValidateQueue = function ValidateQueue(queue, value) {
    for(var i=0; i<queue.length; i++) {
        var result = queue[i].call(this, value);
        if(result) return result;
    }
};

Valid.RunTests = function RunTests(value) {
    result = this.ValidateQueue(this._queue, value);
    if(result && this._errorHandler) {
        return this._errorHandler(value, result);
    }
    return result;
};

// creates simple tests, just supply a function returning true (valid) or false (invalid).
Valid.CreateSimpleTest = function CreateSimpleTest(test) {
    return this.GetChain().AddTest(test);
};


Valid.AddTest = function AddTest(test) {
    if(this._queue === undefined) this._queue = [];
    this._queue.push(test);
    return this;
};



//          client API

Valid.check = function Check(value) {
    var self = this.GetChain();
};


Valid.validate = function Validate(value) {
    return this.GetChain().RunTests(value);
};


Valid.throwErrors = function throwErrors() {
    self = this.GetChain();
    self._errorHandler = function ThrowErrors(value, message) {
        throw value + " " + message;
    };
    return self;
};


//            core tests

Valid.and = function and() {
    var chains = arguments;
    return this.CreateSimpleTest( function And(value) {
        for(var i=0; i<chains.length; i++) {
            result = this.ValidateQueue(chains[i]._queue);
            if(result) return result;
        }
    });
};

Valid.equal = function equal(wanted) {
    return this.CreateSimpleTest( function Equal(value) {
        if(value !== wanted) return "doesn't equal " + wanted;
    });
};

//Valid.notEqual = Valid.not(Valid.equal);


Valid.typeOf = function typeOf(type) {
    return this.CreateSimpleTest(function TypeOf(value) {
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
    return this.CreateSimpleTest( function Match(value) {
        if(!value.match(pattern)) return "doesn't match " + pattern;
    });
};

