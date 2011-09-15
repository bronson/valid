// In practice, I don't think we need to dedup checks.
// TODO: get rid of the Chained function?  It really increases the call stack.


var Valid = function Valid() { };
module.exports = Valid;

// The chain object is the 'this' object passed to each function in the chain.
// The first function in the chain creates it, the rest use it.
Valid.Chain = function Chain() {
    this._queue = [];         // the list of validations to perform
    this._value = undefined;  // the value that we're validating
};



//         error handlers

//   var subchain = Valid.errorHandler(Valid.Boolean).equal(1);
//   var superchain = Valid.errorHandler(Valid.Throw).not(subchain);
// The error handler on the subchain (equal(1)) must be the same as the superchain (not())
// First the Boolean handler installs itself, then errorHandler removes it and installs
// the superchain's Throw handler.  A chain can go from any error handler  to any other!
// Make sure errorHandler() cleans up after your handler and override it if not.
//   TODO: this is overcomplex.  Maybe validate should always return a boolean?

Valid.Throw = function Throw() {
    this.error = function ThrowError(msg) { throw this.ErrorMessage(msg); };
};

Valid.Console = function Console(msg) {
    this.error = function ConsoleError(msg) { console.log(this.ErrorMessage(mgs)); this.AbortChain(); };
};

Valid.Boolean = function Boolean(msg) {
    this.error = function BooleanError(msg) { this._isInvalid = true; this.AbortChain(); };
    var superValidate = this.validate;
    this.validate = function BooleanValidate(val) { superValidate(val); return !this._isInvalid; };
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


Valid.InstallErrorHandler = function InstallErrorHandler(handler) {
    if(this.currentHandler === handler) return;
    this.validate = Valid.validate;   // clean up after the old error handler
    handler.call(this);               // and install the new one
    this.currentHandler = handler;
};


// Computes the final error message, meant to be overridden.
Valid.ErrorMessage = function ErrorMessage(message) {
    return this._value + " " + message;
};


Valid.ValidateQueue = function ValidateQueue(queue) {
    for(var i=0; i<queue.length; i++) {
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

Valid.errorHandler = function(handler) {
    return this.Chained(function ErrorHandler() {
        this.InstallErrorHandler(handler);
    });
};


Valid.check = function(val) {
    return this.Chained(function Check() {
        // patch the Chain to return results immediately
    });
};


Valid.validate = function(value) {
    return this.Chained(function Validate() {
        this._value = value;
        this.ValidateQueue(this._queue);
    });
};


//            final setup

Valid.InstallErrorHandler(Valid.Throw);    // set default error handler


//            core tests

Valid.and = function() {
    var queues = [];

    // set the error handler of all subchains to be the same as ours
    for(var i=0; i < arguments.length; i++) {
        queues.push(arguments[i]._queue);
    }

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

