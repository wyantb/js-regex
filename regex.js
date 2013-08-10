
(function (undefined) {
    'use strict';

    // -----------------------
    // Root Regex
    // -----------------------

    var Regex = function () {
        this._current = '';
        this._cache = {};
        this._flags = undefined;
    };

    Regex.constructor = Regex;
    Regex.fn = Regex.prototype;

    Regex.fn.literal = function literal(character) {
        this._current += getLiteral(character);
        return this;
    };

    Regex.fn.startGroup = function startGroup() {
        return new Group(this);
    };

    Regex.fn.test = function test(string) {
        var regex = this._cache[this._current];
        if (regex) {
            regex = this._cache[this._current] = new RegExp(this._current, this._flags);
        }
        return regex.test(string);
    };

    Regex.fn.reset = function() {
        this._cache = {};
    };

    // -----------------------
    // Helpers
    // -----------------------

    var specialCharacters = '\\^$*+?(){}[]|';

    function getLiteral(character) {
        if (typeof character !== 'string') {
            throw new Error('the literal() function only takes Strings');
        }
        if (character.length !== 1) {
            throw new Error('all literals must be one character');
        }
        return specialCharacters.indexOf(character) === -1 ? character : '\\' + character;
    }

    // -----------------------
    // Group objects
    // -----------------------

    var Group = function (parent) {
        this._parent = parent;
        this._header = '(?:'; // non-capturing by default
        this._contents = '';
        this._footer = ')';
    };

    Group.constructor = Group;
    Group.fn = Group.prototype;

    Group.fn.literal = function literal(character) {
        this._contents += getLiteral(character);
        return this;
    };

    Group.fn.closeGroup = function closeGroup() {
        this._parent.add(this._header + this._contents + this._footer);
        return this._parent;
    };

    Group.fn.keep = function keep() {
        this._header = '(';
        return this;
    };

    Group.fn.discard = function discard() {
        this._header = '(?:';
        return this;
    };

    // -----------------------
    // Option objects
    // -----------------------

    // TODO

    /*global define:true */
    if (typeof define === 'function' && define.amd) {
        define([], Regex);
    }
    else {
        window.Regex = Regex;
    }

}());
