var Valid = require('../lib/validjson');
var DeepCompare = require('./deepcompare');

Valid.assert = function assert(value, expected) {
    var actual = this.test(value);
    var diffstr = DeepCompare("", expected, actual);
    if(diffstr) {
        var exstr = (expected === undefined ? "success" : JSON.stringify(expected));
        var acstr = (actual === undefined ? "success" : JSON.stringify(actual));
        throw value + ":\n expected " + exstr + "\n  but got " + acstr + "\n  (" + diffstr + ")";
    }
};



// quick real-world scenario...

var AddressSchema = {     // schema for an address
    Address         : Valid.array(Valid.string()).len(1,2),
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
        Address      : ["123 Easy St."],
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

// Valid chains
Valid.json(Valid.optional().string()).assert(undefined);
Valid.json(Valid.optional().string()).assert(null);
Valid.json(Valid.optional().string()).assert("5544");
Valid.json(Valid.optional().string()).assert(6655, {'.': {message: 'is of type number not string', value: 6655} });

// functions
Valid.json(function(val) {}).assert(12);
Valid.json(function(val) { return "value is " + val; }).assert(12, {'.': {message: 'value is 12', value: 12} });

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
Valid.json(Valid.array()               ).assert(null,      {".": {message: "is not an array", value: null}});
Valid.json([12, Valid.integer()]).assert([12, 13]);
Valid.json([12, Valid.integer()]).assert([12, "13"],       {"[1]": {message: "is of type string not number", value: "13"}});

