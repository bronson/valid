// Returns a full Valid environment that includes json comparison

var Valid = require('./valid');
module.exports = Valid;


Valid.JsonError = function(path, value, message) {
    var str = '';
    for(var i=0; i<path.length; i++) {
        str += Valid.integer().check(path[i]) ? '['+path[i]+']' : (str === '' ? '' : '.') + path[i];
    }
    if(str == '') str = '.';

    if(this._errors[str]) return;  // ignore duplicate errors
    this._errors[str] = {value: value, message: message};
    this._errorCount += 1;
};


Valid.JsonObject = function(path, value, schema) {
    for(var key in schema) {
        if(!schema.hasOwnProperty(key)) continue;
        if(key in value) {
            this.JsonField(path.concat(key), value[key], schema[key]);
        } else {
            this.JsonError(path, value, "is missing " + key);
        }
        if(this._errorCount > this._maxErrors) break;
    }

    for(key in value) {
        if(!value.hasOwnProperty(key)) continue;
        if(!(key in schema)) this.JsonError(path, value, "shouldn't have " + key);
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
            result = Valid.match(schema).test(value);
            if(result) this.JsonError(path, value, result);
        } else {
            schema.call(this, value);
        }
        break;

        case 'null':
        case 'object':
        if(schema === null) {
            if(value !== null) this.JsonError(path, value, "is not null");
        } else if(value === null) {
            this.JsonError(path, value, "is null");
        } else if(schema instanceof Array) {
            if(value instanceof Array) {
                if(value.length !== schema.length) this.JsonError(path, value, " has " + value.length + " items, not " + schema.length);
                for(var i=0; i < schema.length; i++) {
                    this.JsonField(path.concat(i), value[i], schema[i]);
                    if(this._errorCount > this._maxErrors) break;
                }
            } else {
                this.JsonError(path, value, "is not an Array");
            }
        } else {
            this.JsonObject(path, value, schema);
        }
        break;

        default:
        this.JsonError(path, value, "Error in template: what is " + (typeof schema) + "?");
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

