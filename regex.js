(function (undefined) {

    // -----------------------
    // Root Regex
    // -----------------------

    var Regex = function () {
        this._current = '';
    };

    Regex.constructor = Regex;
    Regex.fn = Regex.prototype;

    Regex.fn.add = function add(token) {
        this._current += token;
        return this;
    };

    Regex.fn.startGroup = function startGroup() {
        return new Group(this);
    };

    Regex.tokens = Regex.fn.tokens = {
        dot: '.',
        // TODO etc

        real_period: '\\.',
        real_question: '\\?',
        // TODO etc
    };

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

    Group.fn.add = function add(token) {
        this._contents += token;
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

    // -----------------------
    // Option objects
    // -----------------------

    // TODO

    if (typeof define === 'function' && define.amd) {
        define([], Regex);
    }
    else {
        window.Regex = Regex;
    }

}());
