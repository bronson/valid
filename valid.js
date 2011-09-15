// In practice, I don't think we need to dedup checks.
// TODO: get rid of the Chained function?  It really increases the call stack.


var Valid = function Valid() { };
module.exports = Valid;

// The chain object is passed to each function in the chain.
// The first function in the chain creates and sets it, the rest add to it.
Valid.Chain = function Chain() {
    this._valid = undefined;  // set to false if any validations fail
    this._value = undefined;  // the value that we're validating
    this._queue = [];         // the list of validations to perform
};



//              internals

Valid.Override = function Override(name, method) {
    if(this === Valid) throw "Don't override root Valid object!";
    var superMethod = this[name];
    this[name] = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(superMethod);
        return method.apply(this, args);
    };
}

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
    for(var i=0; i<queue.length && this._valid === true; i++) {
        queue[i].call(this);
    }
}

// creates simple tests, just supply a function returning true (valid) or false (invalid).
Valid.CreateSimpleTest = function CreateSimpleTest(message,test) {
    return this.Chained(function CreateSimpleTest() {
        this.AddTest(function SimpleTestStub() {
            if(!test.call(this,this._value)) this.error(message);
        });
    });
};


Valid.AddTest = function AddTest(test) {
    this._queue.push(test);
}



//          client API

Valid.check = function Check(val) {
    return this.Chained(function check() {
        // patch the Chain to return results immediately
    });
};


Valid.validate = function Validate(value) {
    return this.Chained(function validate() {
        this._valid = true;
        this._value = value;
        this.ValidateQueue(this._queue);
    });
};


Valid.error = function error(message) {
    if(this === Valid) throw "Called error with no validations!"
    this._valid = false;
};


Valid.throwErrors = function throwErrors() {
    return this.Chained(function throwErrors() {
        this.Override('error', function(superCall, message) {
            superCall.call(message);
            throw this.ErrorMessage(message);
        });
    });
};


//            core tests

Valid.and = function() {
    var queues = [];
    return this.Chained(function() {
        this.AddTest(function And() {
            for(var i=0; i<queues.length; i++) {
                this.ValidateQueue(queues[i]);
            }
        });
    });
}

Valid.equal = function equal(wanted) {
    return this.CreateSimpleTest(
        "doesn't equal " + wanted,
        function Equal(value) { return value === wanted; }
    );
};

//Valid.notEqual = Valid.not(Valid.equal);


Valid.typeOf = function typeOf(type) {
    return this.CreateSimpleTest(
        "is not of type " + type, // TODO: "is a number not string"
        function TypeOf(value) { return typeof value === type; }
    );
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
    return this.CreateSimpleTest(
        "doesn't match " + pattern,
        function Match(val) { return val.match(pattern); }
    );
};

