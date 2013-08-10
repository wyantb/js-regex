
(function (undefined) {
    'use strict';

    // -----------------------
    // Root Regex
    // -----------------------

    var regex = function () {
        var root = Object.create(RegexRoot);
        root._init();
        return root;
    };

    var RegexBase = {};

    RegexBase._init = function _init(_parent, _keeps, _cache) {
        this._current = '';
        this._last = '';

        this._parent = _parent || {};
        this._keeps =  _keeps  || [];// for 'keep' method
        this._cache =  _cache  || {};
    };

    RegexBase.literal = function literal(character) {
        purgeLast(this);

        this._last = getLiteral(character);
        return this;
    };

    RegexBase.literals = function literals(string) {
        purgeLast(this);

        this._last = getLiterals(string);
        return this;
    };

    RegexBase.start = function start() {
        purgeLast(this);

        var newSegment = Object.create(RegexGroup);
        newSegment._init(this, this._keeps, this._cache);
        return newSegment;
    };

    RegexBase.keep = function keep(name) {
        if (arguments.length !== 0 && typeof name !== 'string') {
            throw new Error('named error groups for keep must be a String');
        }
        if (this._keepLast) {
            throw new Error('this group has already been marked to keep as ' + this._keepLast);
        }
        if (this._last === '') {
            throw new Error('nothing to capture');
        }

        if (!name) {
            name = String(this._keeps.length + 1);
        }

        if (lastWasCaptureGroup(this)) {
            // This new group will appear before the current one, so we'll have to shuffle them
            var lastIndex = this._keeps.length - 1;
            var lastGroupName = this._keeps[lastIndex];
            this._keeps[lastIndex] = name;
            this._keeps.push(lastGroupName);
        }
        else {
            // We can just add another group to keep with
            this._keeps.push(name);
        }

        this._last = '(' + this._last + ')';

        return this;
    };

    RegexBase.repeat = function repeat(min, max) {
        if (lastWasMulticharacter(this)) {
            this._last = '(?:' + this._last + ')';
        }

        if (!arguments.length) {
            this._last = this._last + '*';
        }
        else if (arguments.length === 1) {
            if (min === 1) {
                this._last = this._last + '+';
            }
            else {
                this._last = this._last + '{' + min + ',}';
            }
        }
        else {
            this._last = this._last + '{' + min + ',' + max + '}';
        }

        delete this._keepLast;

        return this;
    };

    RegexBase.any = function any(characters) {
        purgeLast(this);

        // TODO errors and such
        this._last = '[' + characters + ']';
        return this;
    };

    RegexBase.none = function none(characters) {
        purgeLast(this);

        // TODO errors and such
        this._last = '[^' + characters + ']';
        return this;
    };

    RegexBase.call = function call(callback) {
        callback.call(this, this);
        return this;
    };

    RegexBase.peek = function peek() {
        return this._current + this._last;
    };

    var RegexGroup = Object.create(RegexBase);
    RegexGroup.close = function close() {
        purgeLast(this);

        this._parent._last = this._current;

        return this._parent;
    };

    // Represents the root object created by executing regex()
    var RegexRoot = Object.create(RegexBase);

    // TODO .macro()     -- to create a macro
    // TODO .macro(name) -- to reference already created macro

    RegexRoot.test = function test(string) {
        purgeLast(this);

        return getCached(this).test(string);
    };

    RegexRoot.replace = function replace(string, callback) {
        if (typeof string !== 'string') {
            throw new Error('can only call replace with a String and callback replace method');
        }

        // TODO callback can be a string or function
        // TODO can handle keep never getting called

        purgeLast(this);

        var node = this;
        return string.replace(getCached(this), function () {
            var args = Array.prototype.slice.call(arguments, 1);

            var callbackHash = {};

            for (var i = 0, len = args.length; i < len; i++) {
                var name = node._keeps[i];
                callbackHash[name] = args[i];
            }

            return callback(callbackHash);
        });
    };

    RegexRoot._reClear = function () {
        purgeLast(this);
        this._current = '';
        return this;
    };

    RegexRoot._cacheClear = function() {
        this._cache = {};
        return this;
    };

    // -----------------------
    // Helpers
    // -----------------------

    var specialCharacters = '\\^$*+?(){}[]|';

    function getLiteral(character) {
        if (typeof character !== 'string') {
            throw new Error('the literal() and literals() functions only takes Strings');
        }
        if (character.length !== 1) {
            throw new Error('only one characteer can be given for literal()');
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

    function purgeLast(node) {
        node._current += node._last;
        node._last = '';
        delete node._keepLast;
    }

    function getCached(node) {
        var regex = node._cache[node._current];
        if (!regex) {
            regex = node._cache[node._current] = new RegExp(node._current, node._flags);
        }

        // TODO option to disable this
        regex.lastIndex = 0;
        return regex;
    }

    function lastWasCaptureGroup(node) {
        return node._last.indexOf('(') === 0 && node._last.indexOf('(?:') !== 0;
    }

    function lastWasChoice(node) {
        return node._last.indexOf('[') === 0;
    }

    function lastWasMulticharacter(node) {
        return !lastWasCaptureGroup(node) && !lastWasChoice(node) &&
            node._last.length >= 2 &&
            // special character literal:
            !(node._last.indexOf('\\') === 0 && node._last.length === 2);
    }

    /*global define:true */
    if (typeof define === 'function' && define.amd) {
        define([], regex);
    }
    else {
        window.regex = regex;
    }

}());
