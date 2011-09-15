// In practice, I don't think we need to dedup checks.


var Valid = function Valid() { };
module.exports = Valid;

// The chain object is the 'this' object passed to each function in the chain.
// The first function in the chain creates it, the rest use it.
Valid.Chain = function Chain() {
    this._field = '.';        // the name of the field we're validating
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

// AsChain needs to surround all chainable calls, otherwise 'this' might be wrong.
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


// computes the final error message
Valid.ErrorMessage = function ErrorMessage(error_message) {
    msg = "";
    if(this._field !== '.') msg += this._field + " ";
    msg += error_message;
    return msg;
};


// Used to create simple tests.  Just supply function returning true (valid) or false (invalid).
Valid.AddTest = function AddTest(msg,func) {
    return this.AsChain(function() {
        this.grind = function grind(value) {
            this._value = value;
            if(!func.call(this,value)) this.error(msg);
        };
    });
};



//          client API

Valid.errorHandler = function(handler) {
    return this.AsChain(function() { handler.call(this); });
};


Valid.check = function(val) {
    return this.AsChain(function() {
        // patch the Chain to return results immediately
    });
};


Valid.validate = function(val) {
    return this.AsChain(function() { this.grind(val); });
};


Valid.typeOf = function(type) {
    return Valid.AddTest(
        "is of type " + type, // TODO: "is a number not string"
        function(val) { return typeof val === type; }
    );
};


Valid.match = function(pattern, modifiers) {
    if(typeof pattern !== 'function') pattern = new RegExp(pattern, modifiers);
    return Valid.CreateTest(
        "doesn't match " + pattern,
        function(val) { val.match(pattern); }
    );
};

