// In practice, I don't think we need to dedup checks.


var Valid = function Valid() { };
module.exports = Valid;

// The chain object is the 'this' object passed to each function in the chain.
// The first function in the chain creates it, the rest use it.
Valid.Chain = function Chain() {
    this._queue = [];         // the list of validations to perform
    this._value = undefined;  // the value that we're validating
};



//         error handlers

Valid.Throw = function Throw() {
    this.error = function ThrowError(msg) { throw this.ErrorMessage(msg); };
};

Valid.Console = function Console(msg) {
    this.error = function ConsoleError(msg) { console.log(this.ErrorMessage(mgs)); this.AbortChain(); };
};

Valid.Boolean = function Boolean(msg) {
    this.error = function BooleanError(msg) { this._isInvalid = true; this.AbortChain(); };
    validate = this.validate;
    this.validate = function BooleanValidate(val) { validate(val); return !this._isInvalid; };
};

Valid.Throw();    // use the Throw error handler by default




//              internals

// surround all chainable calls with AsChain to ensure 'this' is correct.
Valid.AsChain = function AsChain(fn) {
    var self = this;
    if(self === Valid) {
        // This is the first item in the chain so create a new Chain
        this.Chain.prototype = this;
        self = new this.Chain();
    }

    fn.call(self);    // now 'this' is set correctly
    return self;
};


// Computes the final error message, meant to be overridden.
Valid.ErrorMessage = function ErrorMessage(message) {
    return "value " + message;
};


// creates simple tests, just supply a function returning true (valid) or false (invalid).
Valid.CreateTest = function CreateTest(message,test) {
    return this.AsChain(function CreateTest() {
        this.AddTest(function() {
            if(!test.call(this,this._value)) this.error(message);
        });
    });
};


Valid.AddTest = function AddTest(test) {
    this._queue.push(test);
}



//          client API

Valid.errorHandler = function(handler) {
    return this.AsChain(function ErrorHandler() { handler.call(this); });
};


Valid.check = function(val) {
    return this.AsChain(function Check() {
        // patch the Chain to return results immediately
    });
};


Valid.validate = function(value) {
    return this.AsChain(function Validate() {
        this._value = value;
        for(var i=0; i<this._queue.length; i++) {
            this._queue[i].call(this);
        }
    });
};


Valid.typeOf = function(type) {
    return Valid.CreateTest(
        "is of type " + type, // TODO: "is a number not string"
        function TypeOf(value) {
            return typeof value === type;
        }
    );
};


Valid.match = function(pattern, modifiers) {
    if(typeof pattern !== 'function') pattern = new RegExp(pattern, modifiers);
    return Valid.CreateTest(
        "doesn't match " + pattern,
        function Match(val) { val.match(pattern); }
    );
};

