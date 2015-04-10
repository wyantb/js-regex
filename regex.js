
/*global define*/

/**!
 * js-regex: a chainable regex building library for Javascript.
 *
 * @author    Brian Wyant <wyantb@gmail.com>
 * @license   http://opensource.org/licenses/MIT
**/

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module, also provide global
        define([], function () {
            /*jshint -W093*/
            return (root.regex = factory());
            /*jshint +W093*/
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        root.regex = factory();
    }
}(this, function () {
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
        var macro;
        if (!arguments.length) {
            throw new Error('addMacro() must be given the name of the macro to create');
        }
        else if (arguments.length === 1) {
            macro = regex._macros[name] = Object.create(RegexMacro);
            macro._init(regex);
            return macro;
        }
        else if (arguments.length > 1) {
            macro = regex._macros[name] = Object.create(RegexMacro);
            macro._init(regex);
            applyArgs(macro, Array.prototype.slice.call(arguments, 1));
            macro.endMacro();
            return regex;
        }
    };

    var RegexBase = {};

    RegexBase._init = function _init(_parent) {
        this._current = '';
        this._last = '';

        this._state = STATE_EMPTY;
        this._states = {};
        this._numPurged = 0;
        this._captureStack = [];

        this._parent = _parent || {};
        this._cache =  this._parent._cache  || {};
        this._macros = {};

        makeFlags(this);
    };

    RegexBase.clone = function clone() {
        var newRe = regex();
        return deepExtend(newRe, this);
    };

    RegexBase._getMacro = function _getMacro(name) {
        return this._macros[name] || this._parent._getMacro(name);
    };

    RegexBase._purgeLast = function _purgeLast(alwaysPurgeOr) {
        var newPortion = this._last;
        if (alwaysPurgeOr && this._state === STATE_OR) {
            newPortion = '(?:' + newPortion + ')';
        }
        this._current += newPortion;
        this._last = '';

        this._numPurged++;
        this._states[this._newState] = true;
        this._captureFlag = false;
        this._state = this._newState;
        this._newState = STATE_EMPTY;
        return this;
    };

    RegexBase._setLast = function _setLast(last) {
        this._last = last;
        return this;
    };

    RegexBase._getLast = function _getLast() {
        return this._last;
    };

    RegexBase._close = function _close(alwaysPurgeOr) {
        this._newState = this._state;
        return this._purgeLast(alwaysPurgeOr);
    };

    RegexBase._apply = function _apply(node) {
        node._state = this._state;
        return node._setLast(this._current);
    };

    RegexBase._closeAndApply = function _closeAndApply(node, alwaysPurgeOr) {
        this._close(alwaysPurgeOr);
        return this._apply(node);
    };

    RegexBase.call = function call(callback) {
        callback.call(this, this);
        return this;
    };

    RegexBase.peek = function peek() {
        return this._current + this._getLast();
    };

    RegexBase.literal = function literal(character) {
        this._newState = STATE_CHARACTER;
        this._purgeLast(true);

        return this._setLast(getNormalLiteral(character));
    };

    RegexBase.literals = function literals(string) {
        this._newState = string.length > 1 ? STATE_CHARACTERS : STATE_CHARACTER;
        this._purgeLast(true);

        return this._setLast(getLiterals(string));
    };

    RegexBase.macro = function macro(name) {
        this._purgeLast(true);

        var mac = this._getMacro(name);
        mac._apply(this);
        return this;
    };

    regex.macro = function macro(name) {
        var reBase = Object.create(RegexBase);
        reBase._init(regex);
        reBase.macro(name);
        return reBase;
    };

    RegexBase.seq = RegexBase.sequence = function sequence() {
        this._purgeLast(true);

        if (!arguments.length) {
            var newSegment = Object.create(RegexGroup);
            newSegment._init(this);
            return newSegment;
        }
        else {
            var reBase = Object.create(RegexGroup);
            reBase._init(this);
            applyArgs(reBase, Array.prototype.slice.call(arguments, 0));
            return reBase._closeAndApply(this, true);
        }
    };

    regex.seq = regex.sequence = function sequence() {
        var reSeq = Object.create(RegexGroup);
        reSeq._init(regex);

        if (arguments.length) {
            applyArgs(reSeq, Array.prototype.slice.call(arguments, 0));
        }

        return reSeq;
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
        if (name === 'match') {
            throw new Error('the capture group \'match\' represents the entire match group, and cannot be used as a custom named group');
        }

        if (!this._captureFlag) {
            this._captureStack.push(name);
        }
        else {
            this._captureStack.unshift(name);
        }

        this._captureFlag = true;

        var state = this._state;
        this._state = STATE_CAPTURE;

        switch (state) {
        case STATE_NONCAPTURE:
            return this._setLast(this._getLast().replace('(?:', '('));
        default:
            return this._setLast('(' + this._getLast() + ')');
        }
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
        else if (min !== max) {
            this._setLast(this._getLast() + '{' + min + ',' + max + '}');
        }
        else {
            this._setLast(this._getLast() + '{' + min + '}');
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

        this._newState = STATE_FOLLOWEDBY;
        this._purgeLast(true);

        if (arguments.length) {
            return this._setLast('(?=' + getLiterals(string) + ')');
        }
        else {
            var newFollowed = Object.create(RegexIsFollowedBy);
            newFollowed._init(this);
            return newFollowed;
        }
    };

    regex.followedBy = function followedBy(literals) {
        var reFollowed = Object.create(RegexIsFollowedBy);
        reFollowed._init(regex);

        if (literals) {
            reFollowed.literals(literals);
        }

        return reFollowed;
    };

    RegexBase.notFollowedBy = function notFollowedBy(string) {
        if (arguments.length && typeof string !== 'string') {
            throw new Error('if specifying arguments for notFollowedBy(), must be a String of literals');
        }

        this._newState = STATE_FOLLOWEDBY;
        this._purgeLast(true);

        if (arguments.length) {
            return this._setLast('(?!' + getLiterals(string) + ')');
        }
        else {
            var newFollowed = Object.create(RegexNotFollowedBy);
            newFollowed._init(this);
            return newFollowed;
        }
    };

    regex.notFollowedBy = function notFollowedBy(literals) {
        var reFollowed = Object.create(RegexNotFollowedBy);
        reFollowed._init(regex);

        if (literals) {
            reFollowed.literals(literals);
        }

        return reFollowed;
    };

    RegexBase.anyFrom = function anyFrom(firstChar, secondChar) {
        if (typeof firstChar !== 'string' || typeof secondChar !== 'string') {
            throw new Error('must specify two characters for anyFrom() method');
        }

        this._newState = STATE_ANY;
        this._purgeLast(true);

        // TODO -
        return this._setLast('[' + getNormalLiteral(firstChar) + '-' + getNormalLiteral(secondChar) + ']');
    };

    regex.anyFrom = function anyFrom(firstChar, secondChar) {
        var reBase = Object.create(RegexBase);
        reBase._init(regex);
        reBase.anyFrom(firstChar, secondChar);
        return reBase;
    };

    RegexBase.any = function any(characters) {
        // TODO -
        if (arguments.length && typeof characters !== 'string') {
            throw new Error('if specifying arguments for any(), must be a String of literals');
        }

        this._newState = STATE_ANY;
        this._purgeLast(true);

        if (arguments.length) {
            return this._setLast('[' + getSetLiterals(characters) + ']');
        }
        else {
            var newSet = Object.create(RegexAny);
            newSet._init(this);
            return newSet;
        }
    };

    regex.any = function any(literals) {
        var reAny = Object.create(RegexBase);
        reAny._init(regex);

        if (arguments.length) {
            reAny.literals(literals);
            reAny._state = STATE_ANY;
            reAny._setLast('[' + reAny._getLast() + ']');
        }

        return reAny;
    };

    RegexBase.noneFrom = function noneFrom(firstChar, secondChar) {
        if (typeof firstChar !== 'string' || typeof secondChar !== 'string') {
            throw new Error('must specify two characters for noneFrom() method');
        }

        this._newState = STATE_ANY;
        this._purgeLast(true);

        // TODO -
        return this._setLast('[^' + getNormalLiteral(firstChar) + '-' + getNormalLiteral(secondChar) + ']');
    };

    regex.noneFrom = function noneFrom(firstChar, secondChar) {
        var reBase = Object.create(RegexBase);
        reBase._init(regex);
        reBase.noneFrom(firstChar, secondChar);
        return reBase;
    };

    RegexBase.none = function none(characters) {
        // TODO -
        if (arguments.length && typeof characters !== 'string') {
            throw new Error('if specifying arguments for none(), must be a String of literals');
        }

        this._newState = STATE_ANY;
        this._purgeLast(true);

        if (arguments.length) {
            return this._setLast('[^' + getSetLiterals(characters) + ']');
        }
        else {
            var newSet = Object.create(RegexNone);
            newSet._init(this);
            return newSet;
        }
    };

    regex.none = function none(literals) {
        var reNone = Object.create(RegexBase);
        reNone._init(regex);

        if (arguments.length) {
            reNone.literals(literals);
            reNone._state = STATE_ANY;
            reNone._setLast('[^' + reNone._getLast() + ']');
        }

        return reNone;
    };

    RegexBase.or = RegexBase.either = function either(/* Optional: [literals|RegexBase] */) {
        var mustAddNonCapture = this._state !== STATE_EMPTY;

        this._purgeLast(true);

        if (!arguments.length) {
            var newOr = Object.create(RegexEither);
            newOr._init(this, mustAddNonCapture);
            return newOr;
        }
        else {
            var reOr = Object.create(RegexEither);
            reOr._init(this, mustAddNonCapture);
            applyArgs(reOr, Array.prototype.slice.call(arguments, 0));
            return reOr._closeAndApply(this, true);
        }
    };

    regex.or = regex.either = function either(/* Optional: [literals|RegexBase] */) {
        var reOr = Object.create(RegexEither);
        reOr._init(regex, false);

        if (arguments.length) {
            applyArgs(reOr, Array.prototype.slice.call(arguments, 0));
        }

        return reOr;
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
                node._purgeLast(true);
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
            node._purgeLast(true);
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

    var RegexFlags = {};

    RegexFlags.repeat = RegexBase.repeat;
    RegexFlags.capture = RegexBase.capture;
    RegexFlags.optional = RegexBase.optional;

    RegexFlags._purgeLast = function _purgeLast() {
        this._state = this._newState;
        return this;
    };

    RegexFlags._closeAndApply = function _closeAndApply(node) {
        node._state = this._newState;
        return node._setLast(this._current);
    };

    RegexFlags._setLast = function _setLast(last) {
        this._current = last;
        return this;
    };

    RegexFlags._getLast = function _getLast() {
        return this._current;
    };

    RegexFlags.peek = function peek() {
        return this._current;
    };

    Object.defineProperty(regex, 'flags', {
        get: function () {
            var reFlags = Object.create(RegexFlags);
            makeFlags(reFlags);
            return reFlags.flags;
        },
        enumerable: true
    });

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

    RegexGroup.endSequence = RegexGroup.endSeq = RegexGroup.end = function end() {
        this._newState = this._state;
        this._purgeLast(false);

        if (this._parent !== regex) {
            return this._apply(this._parent);
        }
        return this;
    };

    var RegexCharacterSet = Object.create(RegexBase);

    delete RegexCharacterSet.noneFrom;
    delete RegexCharacterSet.none;
    delete RegexCharacterSet.anyFrom;
    delete RegexCharacterSet.any;
    delete RegexCharacterSet.seq;
    delete RegexCharacterSet.sequence;
    delete RegexCharacterSet.capture;
    delete RegexCharacterSet.repeat;

    RegexCharacterSet._close = function _close(alwaysPurgeOr) {
        this._state = STATE_ANY;
        RegexBase._close.call(this, alwaysPurgeOr);

        var setFlags = this._excludeFlag ? '[^' : '[';
        this._current = setFlags + this._current + ']';
        return this;
    };

    RegexCharacterSet.end = function end() {
        return this._closeAndApply(this._parent, true);
    };

    var RegexAny = Object.create(RegexCharacterSet);
    RegexAny._excludeFlag = false;
    RegexAny.endAny = RegexAny.end;

    var RegexNone = Object.create(RegexCharacterSet);
    RegexNone._excludeFlag = true;
    RegexNone.endNone = RegexNone.end;

    var RegexEither = Object.create(RegexBase);

    RegexEither._init = function _init(_parent, _needsGrouping) {
        RegexGroup._init.call(this, _parent);
        this._isActuallyOr = false;
        this._needsGrouping = _needsGrouping;
    };

    RegexEither._purgeLast = function _purgeLast() {
        if (this._current) {
            this._isActuallyOr = true;
            this._current += '|';
        }
        RegexGroup._purgeLast.call(this, true);

        return this;
    };

    RegexEither._close = function _close(alwaysPurgeOr) {
        this._newState = this._state;
        this._purgeLast(alwaysPurgeOr);
        if (this._needsGrouping && this._isActuallyOr) {
            this._state = STATE_NONCAPTURE;
            this._current = '(?:' + this._current + ')';
        }
        else if (this._isActuallyOr) {
            this._state = STATE_OR;
        }
        return this;
    };

    RegexEither.peek = function peek() {
        if (this._current && this._getLast()) {
            return this._current + '|' + this._getLast();
        }
        return RegexBase.peek.call(this);
    };

    RegexEither.endOr = RegexEither.endEither = RegexEither.end = function end() {
        if (this._parent !== regex) {
            return this._closeAndApply(this._parent, true);
        }
        return this._close(true);
    };

    var RegexFollowedBy = Object.create(RegexBase);

    RegexFollowedBy._close = function _close(alwaysPurgeOr) {
        this._state = STATE_FOLLOWEDBY;
        RegexBase._close.call(this, alwaysPurgeOr);

        var notFlags = this._notFlag ? '(?!' : '(?=';
        this._current = notFlags + this._current + ')';
        return this;
    };

    RegexFollowedBy.end = function end() {
        return this._closeAndApply(this._parent, true);
    };

    var RegexIsFollowedBy = Object.create(RegexFollowedBy);
    RegexIsFollowedBy._notFlag = false;
    RegexIsFollowedBy.endFollowedBy = RegexIsFollowedBy.end;

    var RegexNotFollowedBy = Object.create(RegexFollowedBy);
    RegexNotFollowedBy._notFlag = true;
    RegexNotFollowedBy.endNotFollowedBy = RegexNotFollowedBy.end;

    var RegexMacro = Object.create(RegexGroup);

    delete RegexMacro.endSequence;
    delete RegexMacro.endSeq;

    RegexMacro.endMacro = RegexMacro.end = function end() {
        this._newState = this._state;
        this._purgeLast(false);
        return this._parent;
    };

    // Represents the root object created by executing regex()
    var RegexRoot = Object.create(RegexBase);

    RegexRoot.addMacro = function addMacro(name) {
        var macro;
        if (!arguments.length) {
            throw new Error('addMacro() must be given the name of the macro to create');
        }
        else if (arguments.length === 1) {
            macro = this._macros[name] = Object.create(RegexMacro);
            macro._init(this);
            return macro;
        }
        else if (arguments.length > 1) {
            macro = this._macros[name] = Object.create(RegexMacro);
            macro._init(this);
            applyArgs(macro, Array.prototype.slice.call(arguments, 1));
            macro.endMacro();
            return this;
        }
    };

    RegexRoot.test = function test(string) {
        this._purgeLast(false);

        return getCached(this).test(string);
    };

    RegexRoot.replace = function replace(string, callback) {
        if (typeof string !== 'string') {
            throw new Error('can only call replace with a String and callback replace method');
        }

        // TODO callback can be a string or function
        // TODO can handle capture never getting called

        this._purgeLast(false);

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

    RegexRoot.exec = function exec(string) {
        if (typeof string !== 'string') {
            throw new Error('can only call exec with a String');
        }

        this._purgeLast(false);

        var execed = getCached(this).exec(string);

        if (!execed) {
            return null;
        }

        var result = {
            match: execed[0]
        };

        for (var i = 1, len = execed.length; i < len; i++) {
            var name = this._captures[i - 1];
            result[name] = execed[i];
        }

        return result;
    };

    RegexRoot._reClear = function () {
        this._purgeLast(false);
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
    var specialSetCharacters = specialCharacters + '-';

    function getLiteral(character, specialSet) {
        if (typeof character !== 'string') {
            throw new Error('the literal() and literals() functions only takes Strings');
        }
        if (character.length !== 1) {
            throw new Error('only one characteer can be given for literal()');
        }
        return specialSet.indexOf(character) === -1 ? character : '\\' + character;
    }
    function getNormalLiteral(character) {
        return getLiteral(character, specialCharacters);
    }
    function getSetLiteral(character) {
        return getLiteral(character, specialSetCharacters);
    }

    function getLiterals(string) {
        var literals = '';
        for (var i = 0, len = string.length; i < len; i++) {
            literals += getNormalLiteral(string[i]);
        }
        return literals;
    }
    function getSetLiterals(string) {
        var literals = '';
        for (var i = 0, len = string.length; i < len; i++) {
            literals += getSetLiteral(string[i]);
        }
        return literals;
    }

    function deepExtend(target, src, depth) {
        var value, prop;
        for (prop in src) {
            if (src.hasOwnProperty(prop)) {
                value = src[prop];

                if (value instanceof Array) {
                    target[prop] = copy(value);
                }
                else if (value instanceof Function) {
                    // ignore; only used where target should win over source (i.e., bound fns)
                }
                else if (value instanceof Object) {
                    target[prop] = deepExtend({}, value, true);
                }
                else {
                    target[prop] = value;
                }
            }
        }
        return target;
    }
    function copy(arry) {
        var result = new Array(arry.length);
        for (var i = 0, len = arry.length; i < len; i++) {
            result[i] = arry[i];
        }
        return result;
    }

    function getCached(node) {
        node._captures = copy(node._captureStack);

        var regex = node._cache[node._current];
        if (!regex) {
            regex = node._cache[node._current] = new RegExp(node._current, node._flags);
        }

        // TODO option to disable this
        regex.lastIndex = 0;
        return regex;
    }

    function applyArgs(reNode, args) {
        for (var i = 0, len = args.length; i < len; i++) {
            var arg = args[i];
            if (typeof arg === 'string') {
                reNode.literals(arg);
            }
            else if (RegexBase.isPrototypeOf(arg) || RegexFlags.isPrototypeOf(arg)) {
                reNode._newState = reNode._state;
                reNode._purgeLast(true);

                var mustAddNonCapture = reNode._state !== STATE_EMPTY;
                var oldNeedsGrouping = arg._needsGrouping;
                arg._needsGrouping = mustAddNonCapture;
                arg._closeAndApply(reNode);
                arg._needsGrouping = oldNeedsGrouping;
            }
            else {
                throw new Error('if arguments are given to or(), must be either strings or js-regex objects.');
            }
        }
    }

    var STATE_EMPTY = 'STATE_EMPTY';
    var STATE_CHARACTER = 'STATE_CHARACTER';
    var STATE_CHARACTERS = 'STATE_CHARACTERS';
    var STATE_NONCAPTURE = 'STATE_NONCAPTURE';
    var STATE_CAPTURE = 'STATE_CAPTURE';
    var STATE_REPEAT = 'STATE_REPEAT';
    var STATE_OR = 'STATE_OR';
    var STATE_FOLLOWEDBY = 'STATE_FOLLOWEDBY';
    var STATE_ANY = 'STATE_ANY';
    var STATE_OPTIONAL = 'STATE_OPTIONAL';

    return regex;
}));

