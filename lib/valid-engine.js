// valid-engine.js   Scott Bronson    2011
// This file defines the core objects that make Valid run.
// See valid.js for the default set of tests.


// todo? is it possible to turn test objects into arrays?

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

// Adds the given test to the current Chain.
// If data is supplied, it's added to the passed-in test to help introspect when debugging.
Valid.AddTest = function AddTest(test, data) {
    var self = this.GetChain();
    if(self._queue === undefined) self._queue = [];
    if(data) test.data = data;
    self._queue.push(test);
    return self;
};

// Supply a function that that returns undefined on success or an error message on failure, produces a full, chainable test.
// The first arg passed to your your function is the value to test, the rest are the args passed when adding the test.
// i.e. Valid.t = SimpleTest(fn(){...}); Valid.t(4,2).check(9) would call your function with arguments 9, 4, 2.
Valid.SimpleTest = function SimpleTest(fn) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        return this.AddTest( function SimpleTest(value) {
            return fn.apply(this, [value].concat(args));
        }, args);
    };
};

// Run all the tests in the given queue
Valid.ValidateQueue = function ValidateQueue(queue, value) {
    if(!queue || queue.length < 1) return "no tests!";
    for(var i=0; i<queue.length; i++) {
        var error = queue[i].call(this, value);
        if(error === Valid) return; // indicates early success, used by optional()
        if(error) return error;
    }
};

Valid.Escape = function Escape(value) {
    // todo: escape \n, \t, \\, \' and \" in the printed strings
    if(typeof value === 'string') return "'" + value.substring(0,20) + "'";
    return value;
};


// Allows you to reuse a chain as as a chainable test:
//   Valid.isFour = Valid.equal(4).define();    // define the isFour test
//   Valid.integer().isFour().test(4);          // success!
// If you get this error then you forgot to call define() on your chain:
//   Property 'myfunc' of object function Valid() { } is not a function
// It's really shameful that this function needs to exist.
// In an ideal world you could just do this:  Valid.null() = Valid.equal(null);
// In our world, that only works if you don't call it: Valid.null.verify(1);  Ugh.
// Since Valid.equal(null) returns the chain object, if you call null:
//   Valid.null().verify(1) JS complains "Property null is not a function"
// For this to work, JS needs to a callable object with a prototype chain.
// And, without using nonstandard __proto__, I don't think that's possible...?
Valid.define = function define() {
    var queue = this._queue;
    return function() {
        var self = this.GetChain();
        for(var i=0; i<queue.length; i++) {
            self.AddTest(queue[i]);
        }
        return self;
    };
};

