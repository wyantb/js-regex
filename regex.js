
/**
 * js-regex: a chainable regex building library for Javascript.
 *
 * @author    Brian Wyant <wyantb@gmail.com>
 * @license   http://opensource.org/licenses/MIT
**/

(function (undefined) {
    'use strict';

    // -----------------------
    // Root Regex
    // -----------------------

    var regex = function () {
        var root = Object.create(RegexRoot);
        root._init(regex);
        return root;
    };

    regex._macros = {};
    regex._getMacro = function _getMacro(name) {
        if (!regex._macros[name]) {
            throw new Error('Attempted to use macro ' + name + ', which doesn\'t exist.');
        }

        return regex._macros[name];
    };

    // Can use regex() or regex.create()
    regex.create = regex;

    regex.addMacro = function addMacro(name) {
        var macro = regex._macros[name] = Object.create(RegexMacro);
        macro._init(regex);
        return macro;
    };

    var RegexBase = {};

    RegexBase._init = function _init(_parent) {
        this._current = '';
        this._last = '';

        this._parent = _parent || {};
        this._keeps =  this._parent._keeps  || [];
        this._cache =  this._parent._cache  || {};
        this._macros = {};

        makeFlags(this);
    };

    RegexBase._getMacro = function _getMacro(name) {
        return this._macros[name] || this._parent._getMacro(name);
    };

    RegexBase._purgeLast = function _purgeLast() {
        this._current += this._last;
        this._last = '';
    };

    RegexBase._setLast = function _setLast(last) {
        this._last = last;
        return this;
    };

    RegexBase._getLast = function _getLast() {
        return this._last;
    };

    RegexBase.literal = function literal(character) {
        this._purgeLast();

        return this._setLast(getLiteral(character));
    };

    RegexBase.literals = function literals(string) {
        this._purgeLast();

        return this._setLast(getLiterals(string));
    };

    RegexBase.macro = function macro(name) {
        this._purgeLast();

        var mac = this._getMacro(name);
        return this._setLast(mac._current);
    };

    RegexBase.start = function start() {
        this._purgeLast();

        var newSegment = Object.create(RegexGroup);
        newSegment._init(this);
        return newSegment;
    };

    RegexBase.keep = function keep(name) {
        if (arguments.length !== 0 && typeof name !== 'string') {
            throw new Error('named error groups for keep must be a String');
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

        return this._setLast('(' + this._getLast() + ')');
    };

    RegexBase.repeat = function repeat(min, max) {
        if (lastWasMulticharacter(this)) {
            this._setLast('(?:' + this._getLast() + ')');
        }

        if (!arguments.length) {
            this._setLast(this._getLast() + '*');
        }
        else if (arguments.length === 1) {
            if (min === 0) {
                this._setLast(this._getLast() + '*');
            }
            else if (min === 1) {
                this._setLast(this._getLast() + '+');
            }
            else {
                this._setLast(this._getLast() + '{' + min + ',}');
            }
        }
        else {
            this._setLast(this._getLast() + '{' + min + ',' + max + '}');
        }

        return this;
    };

    RegexBase.followedBy = function followedBy(string) {
        if (arguments.length && typeof string !== 'string') {
            throw new Error('if specifying arguments for followedBy(), must be a String of literals');
        }

        if (lastWasMulticharacter(this)) {
            this._setLast('(?:' + this._getLast() + ')');
        }

        this._purgeLast();

        if (arguments.length) {
            return this._setLast('(?=' + getLiterals(string) + ')');
        }
        else {
            var newFollowed = Object.create(RegexFollowedBy);
            newFollowed._init(this, false);
            return newFollowed;
        }
    };

    RegexBase.notFollowedBy = function notFollowedBy(string) {
        if (arguments.length && typeof string !== 'string') {
            throw new Error('if specifying arguments for notFollowedBy(), must be a String of literals');
        }

        if (lastWasMulticharacter(this)) {
            this._setLast('(?:' + this._getLast() + ')');
        }

        this._purgeLast();

        if (arguments.length) {
            return this._setLast('(?!' + getLiterals(string) + ')');
        }
        else {
            var newFollowed = Object.create(RegexFollowedBy);
            newFollowed._init(this, true);
            return newFollowed;
        }
    };

    RegexBase.any = function any(characters) {
        if (arguments.length && typeof characters !== 'string') {
            throw new Error('if specifying arguments for any(), must be a String of literals');
        }

        this._purgeLast();

        if (arguments.length) {
            return this._setLast('[' + getLiterals(characters) + ']');
        }
        else {
            var newSet = Object.create(RegexCharacterSet);
            newSet._init(this, false);
            return newSet;
        }
    };

    RegexBase.none = function none(characters) {
        if (arguments.length && typeof characters !== 'string') {
            throw new Error('if specifying arguments for none(), must be a String of literals');
        }

        this._purgeLast();

        if (arguments.length) {
            return this._setLast('[^' + getLiterals(characters) + ']');
        }
        else {
            var newSet = Object.create(RegexCharacterSet);
            newSet._init(this, true);
            return newSet;
        }
    };

    RegexBase.or = function or() {
        this._purgeLast();

        var newOr = Object.create(RegexOr);
        newOr._init(this);
        return newOr;
    };

    var flagCharacters = {
        '.': '.',
        '^': '^',
        '$': '^',
        'd': '\\d',
        'D': '\\D',
        's': '\\s',
        'S': '\\S',
        'f': '\\f',
        'n': '\\n',
        'r': '\\r',
        't': '\\t',
        'v': '\\v',
        'w': '\\w',
        'W': '\\W',
        '0': '\\0',
    };

    function makeFlags(node) {
        function addFlag(flag) {
            return function flagFn() {
                node._purgeLast();
                node._setLast(flag);

                return node;
            };
        }

        var flags = function flags(flagsToAdd) {
            var newFlags = '';
            for (var i = 0, len = flagsToAdd.length; i < len; i++) {
                var newFlag = flagsToAdd[i];
                if (!flagCharacters[newFlag]) {
                    throw new Error('unrecognized flag: ' + newFlag);
                }
                newFlags += flagCharacters[newFlag];
            }

            node._purgeLast();
            node._setLast(newFlags);

            return node;
        };

        flags.start =                    addFlag('^');
        flags.end =                      addFlag('$');

        flags.any = flags.dot =          addFlag('.');
        flags.digit =                    addFlag('\\d');
        flags.nonDigit =                 addFlag('\\D');
        flags.whitespace =               addFlag('\\s');
        flags.nonWhitespace =            addFlag('\\S');

        flags.backspace =                addFlag('[\\b]');
        flags.wordBoundary =             addFlag('\\b');
        flags.nonWordBoundary =          addFlag('\\B');
        flags.formfeed =                 addFlag('\\f');
        flags.newline = flags.linefeed = addFlag('\\n');
        flags.carriageReturn =           addFlag('\\r');
        flags.tab =                      addFlag('\\t');
        flags.verticalTab =              addFlag('\\v');
        flags.alphanumeric =             addFlag('\\w');
        flags.nonAlphanumberic =         addFlag('\\W');
        flags.nullCharacter =            addFlag('\\0');

        // TODO hexadecimal flags

        node.f = node.flags = flags;
    }

    RegexBase.call = function call(callback) {
        callback.call(this, this);
        return this;
    };

    RegexBase.peek = function peek() {
        return this._current + this._getLast();
    };

    var RegexGroup = Object.create(RegexBase);
    RegexGroup.close = function close() {
        this._purgeLast();

        this._parent._setLast(this._current);

        return this._parent;
    };

    var RegexCharacterSet = Object.create(RegexBase);

    delete RegexCharacterSet.start;
    delete RegexCharacterSet.keep;
    delete RegexCharacterSet.repeat;

    RegexCharacterSet._init = function _init(_parent, _keeps, _cache, _excludeFlag) {
        RegexBase._init.call(this, _parent);
        this._excludeFlag = _excludeFlag;
    };

    RegexCharacterSet.close = function close() {
        this._purgeLast();

        var setFlags = this._excludeFlag ? '[^' : '[';
        return this._parent._setLast(setFlags + this._current + ']');
    };

    var RegexOr = Object.create(RegexGroup);

    RegexOr._purgeLast = function _purgeLast() {
        if (this._current) {
            this._current += '|';
        }
        RegexBase._purgeLast.call(this);

        return this;
    };

    var RegexFollowedBy = Object.create(RegexBase);

    RegexFollowedBy._init = function _init(_parent, _keeps, _cache, _notFlag) {
        RegexBase._init.call(this, _parent);
        this._notFlag = _notFlag;
    };

    RegexFollowedBy.close = function close() {
        this._purgeLast();

        var notFlags = this._notFlag ? '(?!' : '(?=';
        return this._parent._setLast(notFlags + this._current + ')');
    };

    var RegexMacro = Object.create(RegexBase);
    RegexMacro.close = function close() {
        this._purgeLast();
        return this._parent;
    };

    // Represents the root object created by executing regex()
    var RegexRoot = Object.create(RegexBase);

    RegexRoot.addMacro = function addMacro(name) {
        var macro = regex._macros[name] = Object.create(RegexMacro);
        macro._init(this);
        return macro;
    };

    RegexRoot.test = function test(string) {
        this._purgeLast();

        return getCached(this).test(string);
    };

    RegexRoot.replace = function replace(string, callback) {
        if (typeof string !== 'string') {
            throw new Error('can only call replace with a String and callback replace method');
        }

        // TODO callback can be a string or function
        // TODO can handle keep never getting called

        this._purgeLast();

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
        this._purgeLast();
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
        return node._getLast().indexOf('(') === 0 && node._getLast().indexOf('(?:') !== 0;
    }

    function lastWasChoice(node) {
        return node._getLast().indexOf('[') === 0;
    }

    function lastWasMulticharacter(node) {
        return !lastWasCaptureGroup(node) && !lastWasChoice(node) &&
            node._getLast().length >= 2 &&
            // special character literal:
            !(node._getLast().indexOf('\\') === 0 && node._getLast().length === 2);
    }

    /*global define:true */
    if (typeof define === 'function' && define.amd) {
        define([], regex);
    }
    else {
        window.regex = regex;
    }

}());

