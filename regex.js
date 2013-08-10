
(function (undefined) {
    'use strict';

    // -----------------------
    // Root Regex
    // -----------------------

    var Regex = function () {
        var root = Object.create(RegexRoot);
        root._init();
        return root;
    };

    var RegexBase = {};

    RegexBase._init = function _init(_parent, _cache) {
        this._current = '';
        this._cache = _cache || {};
        this._flags = undefined;
        this._last = '';
        this._parent = _parent || {};
    };

    RegexBase.literal = function literal(character) {
        this._current += this._last;
        this._last = getLiteral(character);
        return this;
    };

    RegexBase.literals = function literals(string) {
        this._current += this._last;
        this._last = getLiterals(string);
        return this;
    };

    RegexBase.start = function start() {
        this._current += this._last;
        this._last = '';

        var newSegment = Object.create(RegexBase);
        newSegment._init(this, this._cache);
        return newSegment;
    };

    RegexBase.close = function close() {
        this._current += this._last;
        this._last = '';

        this._parent._last = this._current

        return this._parent;
    };

    // TODO .repeat()

    var RegexRoot = {};
    RegexRoot._init = RegexBase._init;
    RegexRoot.literal = RegexBase.literal;
    RegexRoot.literals = RegexBase.literals;
    RegexRoot.start = RegexBase.start;

    // TODO .macro()     -- to create a macro
    // TODO .macro(name) -- to reference already created macro

    RegexRoot.test = function test(string) {
        this._current += this._last;
        this._last = '';

        var regex = this._cache[this._current];
        if (!regex) {
            regex = this._cache[this._current] = new RegExp(this._current, this._flags);
        }
        return regex.test(string);
    };

    RegexRoot._printCurrent = function _printCurrent() {
        if (window && window.console && window.console.log) {
            window.console.log(this._current + this._last);
        }
        return this;
    };

    RegexRoot.reset = function() {
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
