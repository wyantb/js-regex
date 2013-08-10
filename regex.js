
(function (undefined) {
    'use strict';

    // -----------------------
    // Root Regex
    // -----------------------

    var Regex = function () {
        this._current = '';
        this._cache = {};
        this._flags = undefined;
        this._last = '';
    };

    Regex.constructor = Regex;
    Regex.fn = Regex.prototype;

    Regex.fn.literal = function literal(character) {
        this._current += this._last;
        this._last = getLiteral(character);
        return this;
    };

    Regex.fn.literals = function literals(string) {
        this._current += this._last;
        this._last = getLiterals(string);
        return this;
    };

    Regex.fn.startGroup = function startGroup() {
        this._current += this._last;
        this._last = '';

        return new Group(this);
    };

    Regex.fn.test = function test(string) {
        this._current += this._last;
        this._last = '';

        var regex = this._cache[this._current];
        if (!regex) {
            regex = this._cache[this._current] = new RegExp(this._current, this._flags);
        }
        return regex.test(string);
    };

    Regex.fn._purge = function _purge() {
        this._current += this._last;
        this._last = '';

        return this;
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

    function getLiterals(string) {
        var literals = '';
        for (var i = 0, len = string.length; i < len; i++) {
            literals += getLiteral(string[i]);
        }
        return literals;
    }

    function addToNode(node, content) {
        if (typeof node._current === 'string') {
            node._last = content;
            return;
        }
        else if (typeof node._contents === 'string') {
            node._last = content;
            return;
        }

        // should never happen in prod
        throw new Error('unable to add to parent node?');
    }

    // -----------------------
    // Group objects
    // -----------------------

    var Group = function (parent) {
        this._parent = parent;
        this._header = '(?:'; // non-capturing by default
        this._contents = '';
        this._footer = ')';
        this._last = '';
    };

    Group.constructor = Group;
    Group.fn = Group.prototype;

    Group.fn.literal = function literal(character) {
        this._contents += this._last;
        this._last = getLiteral(character);
        return this;
    };

    Group.fn.literals = function literals(string) {
        this._contents += this._last;
        this._last = getLiterals(string);
        return this;
    };

    Group.fn.startGroup = function startGroup() {
        this._current += this._last;
        this._last = '';

        return new Group(this);
    };

    Group.fn.closeGroup = function closeGroup() {
        this._contents += this._last;
        this._last = '';
        addToNode(this._parent, this._header + this._contents + this._footer);
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
