var Valid = require('../lib/validjson');

// can't use JSON.stringify for comparison because of key order problems
function JsonCompare(path, a, b) {
    if(typeof a !== typeof b) return path + ": " + (typeof a) + " vs " + (typeof b);
    switch(typeof a) {
        case 'string': case 'number': case 'boolean': case 'undefined':
        if(a !== b) return path + ": " + a + " != " + b;
        break;

        case 'null': case 'function': case 'object':
        if(a === null && b !== null) return path + ": should be null";
        if(a !== null && b === null) return path + ": should not be null";
        if(a instanceof Array) {
            if(!(b instanceof Array)) return path + ": should be an Array";
            if(a.length !== b.length) return path + " should be length " + a.length + " not " + b.length;
            for(var i=0; i < a.length; i++) {
                var iresult = JsonCompare(path+"["+i+"]", a[i], b[i]);
                if(iresult) return iresult;
            }
        } else {
            if(b instanceof Array) return path + ": should not be an Array";
            for(var akey in a) {
                if(!a.hasOwnProperty(akey)) continue;
                if(!(akey in b)) return path + ": " + akey + " is missing";
                var aresult = JsonCompare(path+"."+akey, a[akey], b[akey]);
                if(aresult) return aresult;
            }
            for(var bkey in b) {
                if(!b.hasOwnProperty(bkey)) continue;
                if(!(bkey in a)) return path + ": " + bkey + " shouldn't exist";
            }
        }
        break;

        default: throw "what is a " + (typeof a) + "?";
    }
}


// Like check() but throws if the result doesn't match the expectation
Valid.assert = function assert(value, expected) {
    var actual = this.test(value);
    var diffstr = JsonCompare("", expected, actual);
    if(diffstr) {
        var exstr = (expected === undefined ? "success" : JSON.stringify(expected));
        var acstr = (actual === undefined ? "success" : JSON.stringify(actual));
        throw value + ":\n expected " + exstr + "\n  but got " + acstr + "\n  (" + diffstr + ")";
    }
};


Valid.json(true ).assert(true);
Valid.json(false).assert(false);
Valid.json(true ).assert(false,     {'.': {message: "does not equal true", value: false}});
Valid.json(false).assert(true,      {'.': {message: "does not equal false", value: true}});
Valid.json(false).assert(undefined, {'.': {message: "does not equal false", value: undefined}});

Valid.json(null).assert(null);
Valid.json(null).assert(undefined,  {'.': {message: "is not null", value: undefined}});
Valid.json(undefined).assert(undefined);
Valid.json(undefined).assert(null,  {".": {message: "does not equal undefined", value:null}});
Valid.json(null).assert({},         {".": {message: "is not null", value: {}}});
Valid.json({}).assert(null,         {".": {message: "is null", value: null}});

Valid.json('abc'  ).assert('abc');
Valid.json('abc'  ).assert('abc ',  {'.': {message: "does not equal 'abc'", value: "abc "}});
Valid.json(123    ).assert(123);
Valid.json(123    ).assert(123.1,   {'.': {message: "does not equal 123", value: 123.1}});
Valid.json(/^abc$/).assert('abc');
Valid.json(/^abc$/).assert('abcd',  {'.': {message: "does not match /^abc$/", value: 'abcd'}});
Valid.json(/abc/  ).assert('In abc.');
Valid.json(/abc/i ).assert('DEABCDEF');
Valid.json(/abc/  ).assert('DEABCDEF', {".": {message:"does not match /abc/", value:"DEABCDEF"}});

Valid.json({abc: 123}          ).assert({abc: 123});
Valid.json({abc: 123, def: 456}).assert({abc: 123},           {'.': {message: "is missing def", value: {"abc":123}}});
Valid.json({abc: 123}          ).assert({abc: 123, def: 456}, {'.': {message: "shouldn't have def", value: {"abc":123,"def":456}}});
Valid.json({abc: 123}          ).assert({}, {".":{message: "is missing abc", value: {}}});
Valid.json({}                  ).assert({abc: 123}, {".":{message: "shouldn't have abc", value: {"abc":123}}});

Valid.json({a: {b: {c: 1}}}).assert({a: {b: {c: 2}}}, {'a.b.c': {message: "does not equal 1", value: 2}});
Valid.json({a: {b: /wut/i}}).assert({a: {b: "NOWUTY"}});

// arrays
Valid.json([12, 13]).assert([12, 13]);
Valid.json([12, 13]).assert([12, 14],    {"[1]": {message: "does not equal 13", value: 14}});
Valid.json([12, 13]).assert(12,          {".": {message:"is not an Array", value: 12}});
Valid.json([12, 13]).assert(undefined,   {".": {message: "is not an Array", value: undefined}});
Valid.json([12, 13]).assert(null,        {".": {message: "is null", value: null}});

Valid.json(Valid.array()               ).assert([]);
Valid.json(Valid.array()               ).assert([1,2,3]);
Valid.json(Valid.array(Valid.integer())).assert([1,2,3]);
Valid.json(Valid.array(Valid.integer())).assert([1,2,'3'], {".": {message: "item 2 is of type string not number", value: [1,2,"3"]}});
Valid.json(Valid.array()               ).assert({"1":"2"}, {".": {message: "is not an array", value: {"1":"2"}}});
Valid.json(Valid.array()               ).assert(null,      {".": {message: "is null", value: null}});
Valid.json([12, Valid.integer()]).assert([12, 13]);
Valid.json([12, Valid.integer()]).assert([12, "13"],       {"[1]": {message: "is of type string not number", value: "13"}});

/*
var _ = Validator;
schema( _.IsArray(_.IsInteger) ).validate([12, 13, 14]).result();
schema( _.IsArray(_.IsInteger, {min: 1, max: 3}) ).validate([12, 13]).result();
schema( _.IsArray(_.IsString,  {min: 1, max: 3}) ).validate([12, 13]).result(["0: 12 is number, not string for 12,13", "1: 13 is number, not string for 12,13"]); // TODO: improve error message
schema( _.IsArray(_.IsInteger, {min: 3, max: 4}) ).validate([12, 13]).result("12,13 has fewer than 3 elements");
schema( _.IsArray(_.IsInteger, {min: 1, max: 0}) ).validate([12, 13]).result("12,13 has more than 0 elements");
*/
