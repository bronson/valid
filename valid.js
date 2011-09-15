// In practice, I don't think we need to dedup checks.
// TODO: get rid of the Chained function?  It really increases the call stack.


var Valid = function Valid() { };
module.exports = Valid;

// The chain object is passed to each function in the chain.
// The first function in the chain creates and sets it, the rest add to it.
Valid.Chain = function Chain() {
    // this._value = undefined;  // the value that we're validating
    // this._queue = [];         // the list of validation tests to perform
};



//              internals

// surround all chainable calls with Chained.  See match() for an example.
Valid.Chained = function Chained(fn) {
    var self = this;
    if(self === Valid) {     // need a new chain
        this.Chain.prototype = this;
        self = new this.Chain();
    }

    fn.call(self);
    return self;
};


// Computes the final error message, meant to be overridden.  TODO: not true anymore?
Valid.ErrorMessage = function ErrorMessage(message) {
    return this._value + " " + message;
};


Valid.ValidateQueue = function ValidateQueue(queue) {
    for(var i=0; i<queue.length; i++) {
        var result = queue[i].call(this, this._value);
        if(result) return result;
    }
};

Valid.RunTests = function RunTests(value) {
    this._value = value;
    result = this.ValidateQueue(this._queue);
    if(result && this._errorHandler) {
        return this._errorHandler(value, result)
    }
    return result;
};

// creates simple tests, just supply a function returning true (valid) or false (invalid).
Valid.CreateSimpleTest = function CreateSimpleTest(test) {
    return this.Chained(function createSimpleTest() {
        this.AddTest(test);
    });
};


Valid.AddTest = function AddTest(test) {
    if(this._queue === undefined) this._queue = [];
    this._queue.push(test);
};



//          client API

Valid.check = function Check(value) {
    return this.Chained(function check() {
        // patch the Chain to return results immediately
    });
};


Valid.validate = function Validate(value) {
    return this.Chained(function validate() {
        return this.RunTests(value);
    });
};


Valid.throwErrors = function throwErrors() {
    return this.Chained(function throwErrors() {
        this._errorHandler = function ThrowErrors(value, message) {
            throw this.ErrorMessage(message);
        };
    });
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

