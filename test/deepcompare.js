// deepcompare.js
//
// Quickly compare any two JavaScript values.
// Returns a message describing where they differ.
//
// usage:
//   DeepCompare({a:1}, {a:1})  returns undefined, no differences
//   DeepCompare({a:1}, {a:2})  returns a string describing the difference


module.exports = function DeepCompare(a, b, path) {
    // need to duck type because typeof and instanceof don't work reliably
    var isRegExp = function(o) { return o && o.test && o.exec && o.source && (o.global === true || o.global === false) && (o.ignoreCase === true || o.ignoreCase === false) && (o.multiline === true || o.multiline === false); };
    var refields = "source global ignoreCase multiline".split(' ');

    if(path === undefined) path = '';
    if(typeof a !== typeof b) return path + ": " + (typeof a) + " vs " + (typeof b);
    switch(typeof a) {
        case 'string': case 'number': case 'boolean': case 'undefined':
        if(a !== b) return path + ": " + a + " != " + b;
        break;

        case 'null': case 'function': case 'object':
        if(a === null && b !== null) return path + ": should be null";
        if(a !== null && b === null) return path + ": should not be null";
        if(isRegExp(a)) {
            if(!(isRegExp(b))) return path + ": should be a RegExp";
            for(var i in refields) {
                var field = refields[i];
                if(a[field] !== b[field]) return path + ": regexp " + field + ": " + a[field] + " vs. " + b[field];
            }
        } else if(a instanceof Array) {
            if(!(b instanceof Array)) return path + ": should be an Array";
            if(a.length !== b.length) return path + ": should be length " + a.length + " not " + b.length;
            for(var n=0; n < a.length; n++) {
                var nresult = DeepCompare(a[n], b[n], path+"["+n+"]");
                if(nresult) return nresult;
            }
        } else {
            if(b instanceof Array) return path + ": should not be an Array";
            for(var akey in a) {
                if(!a.hasOwnProperty(akey)) continue;
                if(!(akey in b)) return path + ": " + akey + " is missing";
                var aresult = DeepCompare(a[akey], b[akey], path+"."+akey);
                if(aresult) return aresult;
            }
            for(var bkey in b) {
                if(!b.hasOwnProperty(bkey)) continue;
                if(!(bkey in a)) return path + ": " + bkey + " shouldn't exist";
            }
        }
        break;

        default: return path + ": what is a " + (typeof a) + "?";
    }
};

