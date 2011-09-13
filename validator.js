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
//
// TODO: make true/false match true/false
// TODO: how do you specify optional items?


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
        str += this.subject + " " + msg;
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
            if(tmpl === true) {
                if(subject === undefined) this.error("is not defined");
            } else {
                if(subject !== undefined) this.error("is defined");
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
                this.error("Error: template is null!");
            } else {
                this.validate_object(subject, tmpl);
            }
            break;

            case 'undefined':
            this.error("Error: template is undefined!");
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
    },


    //
    //    validators
    //

    IsDefined: function(val) {
        if(undefined === val) this.error('is undefined');
        if(null === val) this.error('is null');
    },

    IsType: function(val, type) {
        this.IsDefined(val);
        if(typeof val !== type) this.error("is " + (typeof val) + " not " + type);
    },

    IsNumber: function(val) {
        this.IsType(val, 'number');
    },

    IsInteger: function(val) {
        this.IsNumber(val);
        if(val % 1 !== 0) this.error(" is not an integer.");
    },

    IsString: function(val) {
        this.IsType(val, 'string');
        if(val.match(/^\s/)) this.error('has leading whitespace');
        if(val.match(/\s$/)) this.error('has trailing whitespace');
    },

    IsNonblankString: function(val) {
        this.IsString(val);
        if(val === '') this.error("can't be blank");
    }
};

// "Validator.create(template)" is the same as new "Validator(template)"
Validator.create = function(template) {
    return new this(template);
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
