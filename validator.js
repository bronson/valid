// To use this:
//
//    var Val = require('validator');
//    var int = new Val(Val.IsInteger);   // create the validator based on a template
//    int.validate(12.0);                 // then validate objects
//    int.validate(12.1);
//
//  The template may be:
//  - an object.  Each field will be compared, fields not mentioned in the template are errors.
//    Objects can be nested arbitrarily deep to match subdocuments.
//  - a regular expression.  The field will be compared to the RE, throwing an error if no match.
//  - function: the value will be passed to the function
//  - true: this must be present (not undefined) but may be anything including null.
//  - false: this field must be undefined
//  - IsOptional(IsInteger) -- an optional integer


var Validator = function(template) {
    this.template = template;
};


Validator.prototype = {
    validate: function(object) {
        this.object = object;
        this.path = [];
        this.validate_field(object, this.template);
    },

    error: function(msg) {
        str = "";
        if(this.path.length > 0) str += this.path + ": ";
        str += (typeof this.subject === 'string' ? "'" + this.subject + "'" : this.subject);
        str += " " + msg;
        if(this.object !== this.subject) str += " for " + this.object;
        console.log(str);
    },

    validate_field: function(subject, tmpl) {
        var save_subject = this.subject;
        this.subject = subject;
        switch(typeof tmpl) {
            case 'string':
            case 'number':
            if(typeof subject !== typeof tmpl) this.error("is not a " + (typeof tmpl));
            if(subject !== tmpl) this.error("does not equal " + tmpl);
            break;

            case 'boolean':
            if(typeof subject === 'boolean') {
                if(subject !== tmpl) this.error("is not " + tmpl);
            } else {
                this.error(" is not a boolean");
            }
            break;

            case 'function':
            if(tmpl instanceof RegExp) {
                if(typeof subject === 'string') {
                    if(!subject.match(tmpl)) this.error("doesn't match " + tmpl);
                } else {
                    this.error("is not a string so can't match " + tmpl);
                }
            } else {
                tmpl.call(this, subject);
            }
            break;

            case 'object':
            if(tmpl === null) {
                if(subject !== null) this.error("is not null");
            } else {
                this.validate_object(subject, tmpl);
            }
            break;

            case 'undefined':
            if(subject !== undefined) this.error("is not undefined");
            break;

            default:
            this.error("Error in template: what is " + (typeof tmpl) + "?");
        }
        this.subject = save_subject;
    },

    validate_object: function(subject, tmpl) {
        var key;
        for(key in subject) {
            if(subject.hasOwnProperty(key)) {
                if(tmpl[key]) {
                    this.path.push(key);
                    this.validate_field(subject[key], tmpl[key]);
                    this.path.pop();
                } else {
                    this.error("has " + key + " but template doesn't");
                }
            }
        }

        for(key in tmpl) {
            if(subject[key] === undefined) this.error("is missing " + key);
        }
    }
};

// "Validator.create(template)" is the same as new "Validator(template)"
Validator.create = function(template) {
    return new this(template);
};




//
//    validators
//

// field may be anything at all, including undefined or null
Validator.IsAnything = function(val) { };

Validator.IsDefined = function(val) {
    if(undefined === val) this.error('is undefined');
    if(null === val) this.error('is null');
};

Validator.IsType = function(val, type) {
    Validator.IsDefined.call(this, val);
    if(typeof val !== type) this.error("is " + (typeof val) + ", not " + type);
};

Validator.IsNumber = function(val) {
    Validator.IsType.call(this, val, 'number');
};

Validator.IsInteger = function(val) {
    Validator.IsNumber.call(this, val);
    if(val % 1 !== 0) this.error(" is not an integer.");
};

Validator.IsString = function(val) {
    Validator.IsType.call(this, val, 'string');
    if(val.match(/^\s/)) this.error('has leading whitespace');
    if(val.match(/\s$/)) this.error('has trailing whitespace');
};

Validator.IsNotBlank = function(val) {
    Validator.IsString.call(this, val);
    if(val === '') this.error("can't be blank");
};

Validator.IsOptional = function(template) {
    return function(val) {
        if(val !== undefined) {
            template.call(this, val);
        }
    };
};

Validator.IsArray = function(template, opts) {
    return function(val) {
        if(typeof val !== 'array') ValidationError(val, "is not an array");
        if(opts.min && val.length < opts.min) ValidationError(val, "array has fewer than " + opts.min + " elements");
        if(opts.max && val.length > opts.max) ValidationError(val, "array has more than " + opts.max + " elements");
        return true;
    };
};

module.exports = Validator;

