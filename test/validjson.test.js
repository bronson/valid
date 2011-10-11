// validjson.test.js
//
// Tests JSON validations that return an Error object


var Valid = require('../lib/valid');
var DeepCompare = require('./deepcompare');


// throws an error unless the result exactly matches what is expected
Valid.assert = function assert(value, expected) {
    var actual = this.check(value);
    var diffstr = DeepCompare(expected, actual);
    if(diffstr) {
        var exstr = (expected === undefined ? "success" : JSON.stringify(expected));
        var acstr = (actual === undefined ? "success" : JSON.stringify(actual));
        throw Error(value + ":\n expected " + exstr + "\n  but got " + acstr + "\n  (" + diffstr + ")");
    }
};



// quick real-world scenario...

var AddressSchema = {     // schema for an address
    Address         : Valid.or(Valid.notBlank(), Valid.array(Valid.notBlank()).len(1,2)),
    CityName        : Valid.notBlank(),
    StateName       : /^[A-Z][A-Z]$/,      // or Valid.oneOf({AR:true,AZ:true,...})
    PostalCode      : /^[0-9]{5}(-[0-9]{4})?/,
    CountryCode     : "US"
};

var PersonSchema = {      // schema for a person
    NamePrefixText  : Valid.equal("", "Mr.", "Mrs.", "Ms.", "Dr."),
    FirstName       : Valid.notBlank(),
    MiddleName      : Valid.optional().string(),
    LastName        : Valid.notBlank(),
    HomeAddress     : AddressSchema,
    WorkAddress     : AddressSchema
};


if(false) Valid.json(PersonSchema).assert({   // now validate this JSON
    NamePrefixText : '',
    FirstName      : 'Scott',
    MiddleName     : null,
    LastName       : 'Bronson',
    HomeAddress    : {
        Address      : "123 Easy St.",
        CityName     : "Santa Cruz",
        StateName    : "CA",
        PostalCode   : "95063-1337",
        CountryCode  : "US"
    },
    WorkAddress    : {
        Address    : ["5 Hard Knock Pl.", "Suite 1314"],
        CityName   : "San Francisco",
        StateName  : "CA",
        PostalCode : "94117-7114",
        CountryCode  : "US"
    }
});


// first test the validation routines
if(Valid.json({a:1}).check({a:1}) !== undefined)    throw Error("test() success must return undefined");
var result = DeepCompare(Valid.json({a:1}).check({a:2}), {'a': 'must equal 1'});
if(result) throw Error("test() failure was wrong: " + result);
if(Valid.json({a:1}).isValid({a:1}) !== true)       throw Error("check() success must return true");
if(Valid.json({a:1}).isValid({a:2}) !== false)      throw Error("check() failure must return false");


// now ensure Valid.json works
Valid.json(true ).assert(true);
Valid.json(false).assert(false);
Valid.json(true ).assert(false,     {'.': "must equal true"});
Valid.json(false).assert(true,      {'.': "must equal false"});
Valid.json(false).assert(undefined, {'.': "must equal false"});

Valid.json(null).assert(null);
Valid.json(null).assert(undefined,  {'.': "must be null"});
Valid.json(undefined).assert(undefined);
Valid.json(undefined).assert(null,  {".": "must equal undefined"});
Valid.json(null).assert({},         {".": "must be null"});
Valid.json({}).assert(null,         {".": "can't be null"});

Valid.json('abc'  ).assert('abc');
Valid.json('abc'  ).assert('abc ',  {'.': "must equal 'abc'"});
Valid.json(123    ).assert(123);
Valid.json(123    ).assert(123.1,   {'.': "must equal 123"});
Valid.json(/^abc$/).assert('abc');
Valid.json(/^abc$/).assert('abcd',  {'.': "must match /^abc$/"});
Valid.json(/abc/  ).assert('In abc.');
Valid.json(/abc/i ).assert('DEABCDEF');
Valid.json(/abc/  ).assert('DEABCDEF', {".": "must match /abc/"});

Valid.json({abc: 123}          ).assert({abc: 123});
Valid.json({abc: 123, def: 456}).assert({abc: 123},           {'.': "must include def"});
Valid.json({abc: 123}          ).assert({abc: 123, def: 456});   // not strict mode so extra keys in value are ignored
Valid.json({abc: 123}          ).assert({}, {".":"must include abc"});
Valid.json({}                  ).assert({abc: 123});             // not strict mode

Valid.json({a: {b: {c: 1}}}).assert({a: {b: {c: 2}}}, {'a':{'b':{'c': "must equal 1"}}});
Valid.json({a: {b: /wut/i}}).assert({a: {b: "NOWUTY"}});
Valid.json({a:{}}).assert({a:1}, {"a":"must be an object"});
Valid.json({a:1,b:{c:{d:2}}}).assert({a:1,b:{c:1}}, {'b':{'c':"must be an object"}});

// Valid chains
Valid.json(Valid.optional().string()).assert(undefined);
Valid.json(Valid.optional().string()).assert(null);
Valid.json(Valid.optional().string()).assert("5544");
Valid.json(Valid.optional().string()).assert(6655, {'.': 'must be a string'});

// functions
Valid.json(function(val) {}).assert(12);
Valid.json(function(val) { return "value is " + val; }).assert(12, {'.': 'value is 12'});

// arrays
Valid.json([12, 13]).assert([12, 13]);
Valid.json([12, 13]).assert([12, 14],    {"1": "must equal 13"});
Valid.json([12, 13]).assert(12,          {".": "must be an array"});
Valid.json([12, 13]).assert(undefined,   {".": "must be an array"});
Valid.json([12, 13]).assert(null,        {".": "can't be null"});

Valid.json(Valid.array()               ).assert([]);
Valid.json(Valid.array()               ).assert([1,2,3]);
Valid.json(Valid.array(Valid.integer())).assert([1,2,3]);
Valid.json(Valid.array(Valid.integer())).assert([1,2,'3'], {".": "item 2 must be an integer"});
Valid.json(Valid.array()               ).assert({"1":"2"}, {".": "must be an array"});
Valid.json(Valid.array()               ).assert(null,      {".": "must be an array"});
Valid.json([12, Valid.integer()]).assert([12, 13]);
Valid.json([12, Valid.integer()]).assert([12, "13"],       {"1": "must be an integer"});

