
/**
 * js-regex: a chainable regex building library for Javascript.
 *
 * @author    Brian Wyant <wyantb@gmail.com>
 * @license   http://opensource.org/licenses/MIT
**/

(function (root, undefined) {
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

        this._state = STATE_EMPTY;
        this._states = {};
        this._numPurged = 0;

        this._parent = _parent || {};
        this._captures =  this._parent._captures  || [];
        this._cache =  this._parent._cache  || {};
        this._macros = {};

        makeFlags(this);
    };

    RegexBase._getMacro = function _getMacro(name) {
        return this._macros[name] || this._parent._getMacro(name);
    };

    RegexBase._purgeLast = function _purgeLast(_noPurgeOr) {
        var newPortion = this._last;
        if (!_noPurgeOr && this._state === STATE_OR) {
            newPortion = '(?:' + newPortion + ')';
        }
        this._current += newPortion;
        this._last = '';

        this._numPurged++;
        this._states[this._newState] = true;
        this._state = this._newState;
        this._newState = STATE_EMPTY;
    };

    RegexBase._setLast = function _setLast(last) {
        this._last = last;
        return this;
    };

    RegexBase._getLast = function _getLast() {
        return this._last;
    };

    RegexBase.literal = function literal(character) {
        this._newState = STATE_CHARACTER;
        this._purgeLast();

        return this._setLast(getLiteral(character));
    };

    RegexBase.literals = function literals(string) {
        this._newState = string.length > 1 ? STATE_CHARACTERS : STATE_CHARACTER;
        this._purgeLast();

        return this._setLast(getLiterals(string));
    };

    RegexBase.macro = function macro(name) {
        this._purgeLast();

        var mac = this._getMacro(name);
        mac._apply(this);
        return this;
    };

    RegexBase.start = function start() {
        this._purgeLast();

        var newSegment = Object.create(RegexGroup);
        newSegment._init(this);
        return newSegment;
    };

    RegexBase.capture = function capture(name) {
        if (arguments.length !== 0 && typeof name !== 'string') {
            throw new Error('named error groups for capture must be a String');
        }
        if (this._getLast() === '' || this._state === STATE_EMPTY) {
            throw new Error('nothing to capture');
        }
        if (this._state === STATE_CAPTURE) {
            throw new Error('capturing twice in a row is pointless');
        }

        if (!name) {
            name = String(this._captures.length + 1);
        }

        this._captures.push(name);
        this._state = STATE_CAPTURE;
        return this._setLast('(' + this._getLast() + ')');
    };

    RegexBase.repeat = function repeat(min, max) {
        if (this._getLast() === '' || this._state === STATE_EMPTY) {
            throw new Error('nothing to repeat');
        }
        if (this._state === STATE_REPEAT) {
            throw new Error('repeating twice in a row will break JS RegExp');
        }

        switch (this._state) {
        case STATE_CHARACTERS:
        case STATE_OR:
            this._setLast('(?:' + this._getLast() + ')');
            break;
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

        this._state = STATE_REPEAT;
        return this;
    };

    RegexBase.optional = function optional() {
        if (this._getLast() === '' || this._state === STATE_EMPTY) {
            throw new Error('nothing to mark as optional');
        }
        if (this._state === STATE_OPTIONAL) {
            throw new Error('marking as optional twice in a row will break JS RegExp');
        }

        switch (this._state) {
        case STATE_CHARACTERS:
        case STATE_OR:
            this._setLast('(?:' + this._getLast() + ')');
            break;
        }

        this._setLast(this._getLast() + '?');
        this._state = STATE_OPTIONAL;
        return this;
    };

    RegexBase.followedBy = function followedBy(string) {
        if (arguments.length && typeof string !== 'string') {
            throw new Error('if specifying arguments for followedBy(), must be a String of literals');
        }

        switch (this._state) {
        case STATE_CHARACTERS:
        case STATE_OR:
            this._setLast('(?:' + this._getLast() + ')');
            break;
        }

        this._newState = STATE_FOLLOWEDBY;
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

        switch (this._state) {
        case STATE_CHARACTERS:
        case STATE_OR:
            this._setLast('(?:' + this._getLast() + ')');
            break;
        }

        this._newState = STATE_FOLLOWEDBY;
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

        this._newState = STATE_ANY;
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

        this._newState = STATE_ANY;
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
        var mustAddNonCapture = this._state !== STATE_EMPTY;

        this._purgeLast();

        var newOr = Object.create(RegexOr);
        newOr._init(this, mustAddNonCapture);
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
                node._newState = STATE_CHARACTER;
                node._purgeLast();
                return node._setLast(flag);
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

            node._newState = flagsToAdd.length > 1 ? STATE_CHARACTERS : STATE_CHARACTER;
            node._purgeLast();
            return node._setLast(newFlags);
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
    RegexGroup._apply = function _apply(node) {
        if (this._state === STATE_OR) {
            node._state = STATE_OR;
        }
        else if (this._states[STATE_CHARACTERS] || this._numPurged > 2) {
            node._state = STATE_CHARACTERS;
        }
        else {
            node._state = this._state;
        }

        return node._setLast(this._current);
    };

    RegexGroup.close = function close() {
        this._newState = this._state;
        this._purgeLast(true);
        return this._apply(this._parent);
    };

    var RegexCharacterSet = Object.create(RegexBase);

    delete RegexCharacterSet.start;
    delete RegexCharacterSet.capture;
    delete RegexCharacterSet.repeat;

    RegexCharacterSet._init = function _init(_parent, _excludeFlag) {
        RegexBase._init.call(this, _parent);
        this._excludeFlag = _excludeFlag;
    };

    RegexCharacterSet.close = function close() {
        this._purgeLast(true);

        var setFlags = this._excludeFlag ? '[^' : '[';
        return this._parent._setLast(setFlags + this._current + ']');
    };

    var RegexOr = Object.create(RegexGroup);

    RegexOr._init = function _init(_parent, _needsGrouping) {
        RegexGroup._init.call(this, _parent);
        this._isActuallyOr = false;
        this._needsGrouping = _needsGrouping;
    };

    RegexOr._purgeLast = function _purgeLast() {
        if (this._current) {
            this._isActuallyOr = true;
            this._current += '|';
        }
        RegexGroup._purgeLast.call(this);

        return this;
    };

    RegexOr.close = function close() {
        this._purgeLast();

        var current = this._current;
        if (this._needsGrouping && this._isActuallyOr) {
            current = '(?:' + current + ')';
        }
        else if (this._isActuallyOr) {
            this._parent._state = STATE_OR;
        }

        return this._parent._setLast(current);
    };

    var RegexFollowedBy = Object.create(RegexBase);

    RegexFollowedBy._init = function _init(_parent, _notFlag) {
        RegexBase._init.call(this, _parent);
        this._notFlag = _notFlag;
    };

    RegexFollowedBy.close = function close() {
        this._purgeLast();

        this._parent._state = STATE_FOLLOWEDBY;

        var notFlags = this._notFlag ? '(?!' : '(?=';
        return this._parent._setLast(notFlags + this._current + ')');
    };

    var RegexMacro = Object.create(RegexGroup);

    RegexMacro.close = function close() {
        this._newState = this._state;
        this._purgeLast(true);
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
        // TODO can handle capture never getting called

        this._purgeLast();

        var node = this;
        return string.replace(getCached(this), function () {
            var args = Array.prototype.slice.call(arguments, 1);

            var callbackHash = {};

            for (var i = 0, len = args.length; i < len; i++) {
                var name = node._captures[i];
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

    var specialCharacters = '\\^$*+?(){}[]|.';

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

    var STATE_EMPTY = 'STATE_EMPTY';
    var STATE_CHARACTER = 'STATE_CHARACTER';
    var STATE_CHARACTERS = 'STATE_CHARACTERS';
    var STATE_CAPTURE = 'STATE_CAPTURE';
    var STATE_REPEAT = 'STATE_REPEAT';
    var STATE_OR = 'STATE_OR';
    var STATE_FOLLOWEDBY = 'STATE_FOLLOWEDBY';
    var STATE_ANY = 'STATE_ANY';
    var STATE_OPTIONAL = 'STATE_OPTIONAL';

    /*global define:true */
    if (typeof define === 'function' && define.amd) {
        define([], regex);
    }
    /*global module:true */
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = regex;
    }
    else {
        root.regex = regex;
    }

}(this));

