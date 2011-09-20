// Returns a full Valid environment that includes json comparison

var Valid = require('./valid');
module.exports = Valid;


Valid.JsonError = function(path, value, message) {
    var pathItem = function(i) {
        return Valid.integer().check(path[i]) ? '['+path[i]+']' : "." + path[i];
    };

    var str = (path[0] === undefined ? "." : pathItem(0));
    for(var i=1; i<path.length; i++) {
        str += pathItem(i);
    }

    if(this._errors[str]) return;  // ignore duplicate errors
    this._errors[str] = {value: value, message: message};
    this._errorCount += 1;
};


Valid.JsonObject = function(path, value, schema) {
    var key;

    for(key in value) {
        if(!value.hasOwnProperty(key)) continue;
        if(schema[key]) {
            this.JsonField(path.concat(key), value[key], schema[key]);
        } else {
            this.JsonError(path, value, "has " + key + " but schema does not");
            if(this._errorCount > this._maxErrors) break;
        }
    }

    for(key in schema) {
        if(!value.hasOwnProperty(key)) continue;
        if(value[key] === undefined) this.JsonError(path, value, "is missing " + key);
        if(this._errorCount > this._maxErrors) break;
    }
};


Valid.JsonField = function(path, value, schema) {
    switch(typeof schema) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'undefined':
        if(value !== schema) this.JsonError(path, value, "does not equal " + Valid.Escape(schema));
        break;

        case 'function':
        if(schema instanceof RegExp) {
            if(typeof value === 'string') {
                if(!value.match(schema)) this.JsonError(path, value, "does not match " + schema);
            } else {
                this.error("is not a string so can't match " + schema);
            }
        } else {
            schema.call(this, value);
        }
        break;

        case 'null':
        case 'object':
        if(schema === null) {
            if(value !== null) this.error("is not null");
        } else if(schema instanceof Array) {
            if(value instanceof Array) {
                if(value.length !== schema.length) this.error(" has " + value.length + " items, not " + schema.length);
                for(var i=0; i < Math.min(schema.length, value.length); i++) {
                    this.JsonField(path.concat(i), value[i], schema[i]);
                    if(this._errorCount > this._maxErrors) break;
                }
            } else {
                this.error("is not an Array");
            }
        } else {
            this.JsonObject(value, schema);
        }
        break;

        default:
        this.error(path, value, "Error in template: what is " + (typeof schema) + "?");
    }
};


Valid.json = function json(schema) {
    return this.AddTest(function Json(value, maxErrors) {
        this._errors = {};
        this._errorCount = 0;
        this._maxErrors = maxErrors || 20;
        this.JsonField([], value, schema, {});
        if(this._errorCount > 0) return this._errors;
    }, schema);
};

