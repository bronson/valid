// deepcompare.js
// Quickly compare two JavaScript values.
//
// can't use JSON.stringify for comparison because of key order problems
// returns undefined if equal or a string describing the location of the difference.

module.exports = function DeepCompare(path, a, b) {
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
                var iresult = DeepCompare(path+"["+i+"]", a[i], b[i]);
                if(iresult) return iresult;
            }
        } else {
            if(b instanceof Array) return path + ": should not be an Array";
            for(var akey in a) {
                if(!a.hasOwnProperty(akey)) continue;
                if(!(akey in b)) return path + ": " + akey + " is missing";
                var aresult = DeepCompare(path+"."+akey, a[akey], b[akey]);
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

