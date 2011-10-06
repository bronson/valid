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
var result = DeepCompare(Valid.json({a:1}).check({a:2}), {'a': {value: 2, message: 'must equal 1'}});
if(result) throw Error("test() failure was wrong: " + result);
if(Valid.json({a:1}).isValid({a:1}) !== true)       throw Error("check() success must return true");
if(Valid.json({a:1}).isValid({a:2}) !== false)      throw Error("check() failure must return false");


// now ensure Valid.json works
Valid.json(true ).assert(true);
Valid.json(false).assert(false);
Valid.json(true ).assert(false,     {'.': {message: "must equal true", value: false}});
Valid.json(false).assert(true,      {'.': {message: "must equal false", value: true}});
Valid.json(false).assert(undefined, {'.': {message: "must equal false", value: undefined}});

Valid.json(null).assert(null);
Valid.json(null).assert(undefined,  {'.': {message: "must be null", value: undefined}});
Valid.json(undefined).assert(undefined);
Valid.json(undefined).assert(null,  {".": {message: "must equal undefined", value:null}});
Valid.json(null).assert({},         {".": {message: "must be null", value: {}}});
Valid.json({}).assert(null,         {".": {message: "can't be null", value: null}});

Valid.json('abc'  ).assert('abc');
Valid.json('abc'  ).assert('abc ',  {'.': {message: "must equal 'abc'", value: "abc "}});
Valid.json(123    ).assert(123);
Valid.json(123    ).assert(123.1,   {'.': {message: "must equal 123", value: 123.1}});
Valid.json(/^abc$/).assert('abc');
Valid.json(/^abc$/).assert('abcd',  {'.': {message: "must match /^abc$/", value: 'abcd'}});
Valid.json(/abc/  ).assert('In abc.');
Valid.json(/abc/i ).assert('DEABCDEF');
Valid.json(/abc/  ).assert('DEABCDEF', {".": {message:"must match /abc/", value:"DEABCDEF"}});

Valid.json({abc: 123}          ).assert({abc: 123});
Valid.json({abc: 123, def: 456}).assert({abc: 123},           {'.': {message: "must include def", value: {"abc":123}}});
Valid.json({abc: 123}          ).assert({abc: 123, def: 456}, {'.': {message: "can't include def", value: {"abc":123,"def":456}}});
Valid.json({abc: 123}          ).assert({}, {".":{message: "must include abc", value: {}}});
Valid.json({}                  ).assert({abc: 123}, {".":{message: "can't include abc", value: {"abc":123}}});

Valid.json({a: {b: {c: 1}}}).assert({a: {b: {c: 2}}}, {'a.b.c': {message: "must equal 1", value: 2}});
Valid.json({a: {b: /wut/i}}).assert({a: {b: "NOWUTY"}});
Valid.json({a:{}}).assert({a:1}, {"a":{"value":1,"message":"must be an object"}});
Valid.json({a:1,b:{c:{d:2}}}).assert({a:1,b:{c:1}}, {"b.c":{"value":1,"message":"must be an object"}});

// Valid chains
Valid.json(Valid.optional().string()).assert(undefined);
Valid.json(Valid.optional().string()).assert(null);
Valid.json(Valid.optional().string()).assert("5544");
Valid.json(Valid.optional().string()).assert(6655, {'.': {message: 'must be a string', value: 6655} });

// functions
Valid.json(function(val) {}).assert(12);
Valid.json(function(val) { return "value is " + val; }).assert(12, {'.': {message: 'value is 12', value: 12} });

// arrays
Valid.json([12, 13]).assert([12, 13]);
Valid.json([12, 13]).assert([12, 14],    {"[1]": {message: "must equal 13", value: 14}});
Valid.json([12, 13]).assert(12,          {".": {message:"must be an array", value: 12}});
Valid.json([12, 13]).assert(undefined,   {".": {message: "must be an array", value: undefined}});
Valid.json([12, 13]).assert(null,        {".": {message: "can't be null", value: null}});

Valid.json(Valid.array()               ).assert([]);
Valid.json(Valid.array()               ).assert([1,2,3]);
Valid.json(Valid.array(Valid.integer())).assert([1,2,3]);
Valid.json(Valid.array(Valid.integer())).assert([1,2,'3'], {".": {message: "item 2 must be an integer", value: [1,2,"3"]}});
Valid.json(Valid.array()               ).assert({"1":"2"}, {".": {message: "must be an array", value: {"1":"2"}}});
Valid.json(Valid.array()               ).assert(null,      {".": {message: "must be an array", value: null}});
Valid.json([12, Valid.integer()]).assert([12, 13]);
Valid.json([12, Valid.integer()]).assert([12, "13"],       {"[1]": {message: "must be an integer", value: "13"}});

