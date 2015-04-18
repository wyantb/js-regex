/*global define,module,console*/

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
        return Object.create(RegexRoot)._init(regex);
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
            applyArgs(macro, rest(arguments));
            macro.endMacro();
            return regex;
        }
    };

    var RegexBase = {};
    RegexBase._type = 'base';

    RegexBase._initFields = function _initFields(_parent) {
        this._terms = [];
        this._parent = _parent || {};
        this._macros = {};
        return this;
    };
    RegexBase._init = function _init(_parent) {
        this._initFields(_parent);
        makeFlagFns(this);
        return this;
    };

    RegexBase.clone = function clone() {
        var newRe = regex();
        return deepExtend(newRe, this);
    };

    RegexBase._getMacro = function _getMacro(name) {
        return this._macros[name] || this._parent._getMacro(name);
    };

    RegexBase._purgeLast = function _purgeLast() {
        console.warn('purgeLast -- noop');
        return this;
    };

    RegexBase._setLast = function _setLast(last) {
        console.warn('setLast -- noop');
        return this;
    };

    RegexBase._getLast = function _getLast() {
        console.warn('getLast -- noop');
        return this;
    };

    RegexBase._close = function _close() {
        console.warn('close -- noop');
        return this;
    };

    RegexBase._apply = function _apply(node) {
        console.warn('apply -- noop');
        return this;
    };

    RegexBase._closeAndApply = function _closeAndApply(node) {
        console.warn('closeAndApply -- noop');
        return this;
    };

    RegexBase._renderNodes = function _renderNodes(nodes) {
        var rendered = '';
        for (var i = 0, len = nodes.length; i < len; i++) {
            var term = nodes[i].term;

            // TODO depend on the state of the term
            if ((identifyState(term) === STATE_OR) && hasNonEmptyNeighborNode(nodes, i)) {
                rendered += '(?:' + term + ')';
            }
            else {
                rendered += term;
            }
        }
        return rendered;
    };
    RegexBase._addTerm = function _addTerm(term, typeOverride) {
        this._terms.push({
            captures: [],
            type: typeOverride,
            term: term
        });
        return this;
    };

    function currentTerm(rb) {
        return rb._terms[rb._terms.length - 1];
    }
    function wrapCurrentTerm(rb, pre, post) {
        var curTerm = currentTerm(rb);
        curTerm.term = pre + curTerm.term + post;
        return rb;
    }
    function replaceCurrentTerm(rb, match, replace) {
        var curTerm = currentTerm(rb);
        curTerm.term.replace(match, replace);
        return rb;
    }
    function identifyCurrentTerm(rb) {
        return identifyState(currentTerm(rb).term);
    }
    function addCapture(rb, capture) {
        currentTerm(rb).captures.push(capture);
    }
    function applyArgumentsToNode(proto, node, args) {
        var toApply = Object.create(proto)._init(node);
        applyArgs(toApply, args);
        return node._addTerm(toApply.peek());
    }
    function applyArgumentsWithoutNode(proto, args) {
        var toApply = Object.create(proto)._init(regex);
        if (args.length) {
            applyArgs(toApply, args);
        }
        return toApply;
    }

    RegexBase.call = function call(callback) {
        callback.call(this, this);
        return this;
    };

    RegexBase.peek = function peek() {
        return this._renderNodes(this._terms);
    };

    RegexBase.literal = function literal(character) {
        return this._addTerm(getNormalLiteral(character));
    };

    RegexBase.literals = function literals(string) {
        return this._addTerm(getLiterals(string));
    };

    RegexBase.macro = function macro(name) {
        console.error('macro -- broken');
        var mac = this._getMacro(name);
        mac._apply(this);
        return this;
    };

    regex.macro = function macro(name) {
        var reBase = Object.create(RegexBase)._init(regex);
        reBase.macro(name);
        return reBase;
    };

    RegexBase.seq = RegexBase.sequence = function sequence() {
        if (!arguments.length) {
            return Object.create(RegexGroup)._init(this);
        }
        else {
            return applyArgumentsToNode(RegexGroup, this, copy(arguments));
        }
    };

    regex.seq = regex.sequence = function sequence() {
        return applyArgumentsWithoutNode(RegexGroup, copy(arguments));
    };

    RegexBase.capture = function capture(name) {
        if (name == null) {
            name = String(Math.random() * 1000000);
        }
        if (typeof name !== 'string') {
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

        addCapture(this, name);

        if (identifyCurrentTerm(this) === STATE_OPENNONCAPTURE) {
            return replaceCurrentTerm(this, '(?:', '(');
        }
        else {
            return wrapCurrentTerm(this, '(', ')');
        }
    };

    function maybeWrapInOpennoncapture(rb) {
        switch (identifyCurrentTerm(rb)) {
        case STATE_EMPTY:
        case STATE_CHARACTER:
            break;
        default:
            wrapCurrentTerm(rb, '(?:', ')');
            break;
        }
    }
    RegexBase.repeat = function repeat(min, max) {
        if (this._getLast() === '' || this._state === STATE_EMPTY) {
            throw new Error('nothing to repeat');
        }
        if (this._state === STATE_REPEAT) {
            throw new Error('repeating twice in a row will break JS RegExp');
        }

        maybeWrapInOpennoncapture(this);

        if (!arguments.length) {
            return wrapCurrentTerm(this, '', '*');
        }
        else if (arguments.length === 1) {
            if (min === 0) {
                return wrapCurrentTerm(this, '', '*');
            }
            else if (min === 1) {
                return wrapCurrentTerm(this, '', '+');
            }
            else {
                return wrapCurrentTerm(this, '', '{' + min + ',}');
            }
        }
        else if (min !== max) {
            return wrapCurrentTerm(this, '', '{' + min + ',' + max + '}');
        }
        else {
            return wrapCurrentTerm(this, '', '{' + min + '}');
        }
    };

    RegexBase.optional = function optional() {
        if (this._getLast() === '' || this._state === STATE_EMPTY) {
            throw new Error('nothing to mark as optional');
        }
        if (this._state === STATE_OPTIONAL) {
            throw new Error('marking as optional twice in a row will break JS RegExp');
        }

        maybeWrapInOpennoncapture(this);
        return wrapCurrentTerm(this, '', '?');
    };

    RegexBase.followedBy = function followedBy(string) {
        if (arguments.length && typeof string !== 'string') {
            throw new Error('if specifying arguments for followedBy(), must be a String of literals');
        }

        if (arguments.length) {
            return this._addTerm('(?=' + getLiterals(string) + ')');
        }
        else {
            return Object.create(RegexIsFollowedBy)._init(this);
        }
    };

    regex.followedBy = function followedBy() {
        return applyArgumentsWithoutNode(RegexIsFollowedBy, copy(arguments));
    };

    RegexBase.notFollowedBy = function notFollowedBy(string) {
        if (arguments.length && typeof string !== 'string') {
            throw new Error('if specifying arguments for notFollowedBy(), must be a String of literals');
        }

        if (arguments.length) {
            return this._addTerm('(?!' + getLiterals(string) + ')');
        }
        else {
            return Object.create(RegexNotFollowedBy)._init(this);
        }
    };

    regex.notFollowedBy = function notFollowedBy(literals) {
        return applyArgumentsWithoutNode(RegexNotFollowedBy, copy(arguments));
    };

    RegexBase.anyFrom = function anyFrom(firstChar, secondChar) {
        if (typeof firstChar !== 'string' || typeof secondChar !== 'string') {
            throw new Error('must specify two characters for anyFrom() method');
        }

        // TODO shouldn't this be set literal?  I mean what if you want - to something else
        var term = '[' + getNormalLiteral(firstChar) + '-' + getNormalLiteral(secondChar) + ']';
        return this._addTerm(term);
    };

    regex.anyFrom = function anyFrom(firstChar, secondChar) {
        return Object.create(RegexBase)._init(regex).anyFrom(firstChar, secondChar);
    };

    RegexBase.any = function any(characters) {
        if (arguments.length && typeof characters !== 'string') {
            throw new Error('if specifying arguments for any(), must be a String of literals');
        }

        if (arguments.length) {
            return this._addTerm('[' + getSetLiterals(characters) + ']');
        }
        else {
            return Object.create(RegexAny)._init(this);
        }
    };

    // TODO call this anyOf?  sounds odd
    regex.any = function any(literals) {
        return Object.create(RegexBase)._init(regex).any(literals);
    };

    RegexBase.noneFrom = function noneFrom(firstChar, secondChar) {
        if (typeof firstChar !== 'string' || typeof secondChar !== 'string') {
            throw new Error('must specify two characters for noneFrom() method');
        }

        var term = '[^' + getNormalLiteral(firstChar) + '-' + getNormalLiteral(secondChar) + ']';
        return this._addTerm(term);
    };

    regex.noneFrom = function noneFrom(firstChar, secondChar) {
        return Object.create(RegexBase)._init(regex).noneFrom(firstChar, secondChar);
    };

    // TODO call this noneOf?  sounds odd
    RegexBase.none = function none(characters) {
        if (arguments.length && typeof characters !== 'string') {
            throw new Error('if specifying arguments for none(), must be a String of literals');
        }

        if (arguments.length) {
            return this._addTerm('[^' + getSetLiterals(characters) + ']');
        }
        else {
            return Object.create(RegexNone)._init(this);
        }
    };

    regex.none = function none(literals) {
        return Object.create(RegexBase)._init(regex).none(literals);
    };

    RegexBase.or = RegexBase.either = function either(/* Optional: [literals|RegexBase] */) {
        if (!arguments.length) {
            return Object.create(RegexEither)._init(this);
        }
        else {
            return applyArgumentsToNode(RegexEither, this, copy(arguments));
        }
    };

    regex.or = regex.either = function either(/* Optional: [literals|RegexBase] */) {
        return applyArgumentsWithoutNode(RegexEither, copy(arguments));
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

    function makeFlagFns(node) {
        function addFlag(flag) {
            return function flagFn() {
                return node._addTerm(flag);
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

            return node._addTerm(newFlags);
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
        return node;
    }

    var RegexFlags = {};
    RegexFlags._type = 'flags';
    RegexFlags._initFields = RegexBase._initFields;
    RegexFlags._addTerm = RegexBase._addTerm;
    RegexFlags._renderNodes = RegexBase._renderNodes;
    RegexFlags.peek = RegexBase.peek;
    RegexFlags.repeat = RegexBase.repeat;
    RegexFlags.capture = RegexBase.capture;
    RegexFlags.optional = RegexBase.optional;

    Object.defineProperty(regex, 'flags', {
        get: function () {
            var reFlags = Object.create(RegexFlags)._initFields(regex);
            makeFlagFns(reFlags);
            return reFlags.flags;
        },
        enumerable: true
    });

    var RegexGroup = Object.create(RegexBase);
    RegexGroup._type = 'group';

    RegexGroup.endSequence = RegexGroup.endSeq = RegexGroup.end = function end() {
        if (this._parent !== regex) {
            return this._parent._addTerm(this._renderNodes(this._terms));
        }
        return this;
    };

    var RegexCharacterSet = Object.create(RegexBase);
    RegexCharacterSet._type = 'characterSet';

    // TODO am I really not creative enough to do better?  Not to mention, liskov substitution principle...
    delete RegexCharacterSet.noneFrom;
    delete RegexCharacterSet.none;
    delete RegexCharacterSet.anyFrom;
    delete RegexCharacterSet.any;
    delete RegexCharacterSet.seq;
    delete RegexCharacterSet.sequence;
    delete RegexCharacterSet.capture;
    delete RegexCharacterSet.repeat;

    var RegexAny = Object.create(RegexCharacterSet);
    RegexAny._type = 'any';
    RegexAny._excludeFlag = false;
    RegexAny.endAny = RegexAny.end;

    var RegexNone = Object.create(RegexCharacterSet);
    RegexNone._type = 'none';
    RegexNone._exclueFlag = true;
    RegexNone.endNone = RegexNone.end;

    var RegexEither = Object.create(RegexBase);
    RegexEither._type = 'either';
    RegexEither.end = RegexEither.endEither = RegexEither.endOr = RegexGroup.end;

    RegexEither._renderNodes = function _renderNodes(nodes) {
        return pluck(nodes, 'term').join('|');
    };

    var RegexFollowedBy = Object.create(RegexBase);
    RegexFollowedBy._type = 'followedByBase';

    // TODO need this in the hierarchy
    RegexFollowedBy._close = function _close() {
        this._state = STATE_FOLLOWEDBY;
        RegexBase._close.call(this);

        var notFlags = this._notFlag ? '(?!' : '(?=';
        this._current = notFlags + this._current + ')';
        return this;
    };

    RegexFollowedBy.end = function end() {
        return this._closeAndApply(this._parent, true);
    };

    var RegexIsFollowedBy = Object.create(RegexFollowedBy);
    RegexIsFollowedBy._type = 'isFollowedBy';
    RegexIsFollowedBy._notFlag = false;
    RegexIsFollowedBy.endFollowedBy = RegexIsFollowedBy.end;

    var RegexNotFollowedBy = Object.create(RegexFollowedBy);
    RegexNotFollowedBy._type = 'notFollowedBy';
    RegexNotFollowedBy._notFlag = true;
    RegexNotFollowedBy.endNotFollowedBy = RegexNotFollowedBy.end;

    var RegexMacro = Object.create(RegexGroup);
    RegexMacro._type = 'macro';

    delete RegexMacro.endSequence;
    delete RegexMacro.endSeq;

    RegexMacro.endMacro = RegexMacro.end = function end() {
        return this._parent;
    };

    // Represents the root object created by executing regex()
    var RegexRoot = Object.create(RegexBase);
    RegexRoot._type = 'root';

    RegexRoot.addMacro = function addMacro(name) {
        /*jshint -W093*/
        if (!arguments.length) {
            throw new Error('addMacro() must be given the name of the macro to create');
        }
        else if (arguments.length === 1) {
            return this._macros[name] = Object.create(RegexMacro)._init(this);
        }
        else if (arguments.length > 1) {
            var macro = this._macros[name] = Object.create(RegexMacro)._init(this);
            applyArgs(macro, rest(arguments));
            macro.endMacro();
            return this;
        }
        /*jshint +W093*/
    };

    RegexRoot.test = function test(string) {
        console.warn('test -- noop');
        return this;
    };

    RegexRoot.replace = function replace(string, callback) {
        if (typeof string !== 'string') {
            throw new Error('can only call replace with a String and callback replace method');
        }

        // TODO callback can be a string or function
        // TODO can handle capture never getting called

        var node = this;
        return string.replace(toRegExp(this), function () {
            var args = rest(arguments);

            var captures = flatten(pluck(node._terms, 'captures'));
            var callbackHash = {};

            for (var i = 0, len = args.length; i < len; i++) {
                var name = captures[i];
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

        var execed = toRegExp(this).exec(string);

        if (!execed) {
            return null;
        }

        var captures = flatten(pluck(this._terms, 'captures'));
        var result = {
            match: execed[0]
        };

        for (var i = 1, len = execed.length; i < len; i++) {
            var name = captures[i];
            result[name] = execed[i];
        }

        return result;
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

    function copyFrom(arry, idx) {
        var result = new Array(arry.length - idx);
        for (var i = 0, len = arry.length - idx; i < len; i++) {
            result[i] = arry[i + idx];
        }
        return result;
    }
    function copy(arry) {
        return copyFrom(arry, 0);
    }
    function rest(arry) {
        return copyFrom(arry, 1);
    }
    function flatten(arry, accum) {
        accum = accum || [];
        for (var i = 0, len = arry.length; i < len; i++) {
            var val = arry[i];
            if (val instanceof Array) {
                flatten(val, accum);
            }
            else {
                accum.push(val);
            }
        }
        return accum;
    }

    function toRegExp(node) {
        return new RegExp(node._current);
    }

    function applyArgs(reNode, args) {
        for (var i = 0, len = args.length; i < len; i++) {
            var arg = args[i];
            if (typeof arg === 'string') {
                reNode.literals(arg);
            }
            else if (RegexBase.isPrototypeOf(arg) || RegexFlags.isPrototypeOf(arg)) {
                reNode._addTerm(arg.peek());
            }
            else {
                throw new Error('if arguments are given to or(), must be either strings or js-regex objects.');
            }
        }
    }

    function pluck(arry, field) {
        var res = [];
        for (var i = 0, len = arry.length; i < len; i++) {
            res.push(arry[i][field]);
        }
        return res;
    }
    function contains(str, match) {
        return str.indexOf(match) !== -1;
    }
    function startsWith(str, match) {
        return str.indexOf(match) === 0;
    }
    function endsWith(str, match) {
        return str.indexOf(match) === (str.length - match.length);
    }
    function endsWithNonEscaped(str, match) {
        return endsWith(str, match) && !endsWith(str, '\\' + match);
    }
    function nullOrEmpty(str) {
        return str == null || str === '';
    }

    function identifyState(snippet) {
        /*jshint -W084*/
        var execState;
        if (snippet.length === 0) {
            return STATE_EMPTY;
        }
        if (snippet.length === 1) { // TODO FIXME could be true with unicode or flags, also
            return STATE_CHARACTER;
        }
        if (endsWithNonEscaped(snippet, '*') || endsWithNonEscaped(snippet, '?')) {
            return STATE_MODIFIEDTERM;
        }
        if (startsWith(snippet, '(?:')) {
            return STATE_OPENNONCAPTURE;
        }
        // see tests/states.js - \( and \) don't defeat the or, but (a|b) does
        if (contains(snippet, '|')) {
            execState = /(.?\()?.*\|.*(.\))/.exec(snippet);
            if (execState == null || nullOrEmpty(execState[1]) || nullOrEmpty(execState[2]) ||
                (execState[1] === '\\(' && execState[2] === '\\)')) {

                return STATE_OR;
            }
        }
        if (endsWithNonEscaped(snippet, ')')) {
            return STATE_CLOSEDGROUP;
        }
        return STATE_TERM;
        /*jshint +W084*/
    }

    function hasNonEmptyNeighborNode(nodes, i) {
        if (i > 0 && identifyState(nodes[i - 1].term) !== STATE_EMPTY) {
            return true;
        }
        if (i < (nodes.length - 1) && identifyState(nodes[i + 1].term) !== STATE_EMPTY) {
            return true;
        }
        return false;

    }

    // TODO FIXME exclude from 'production' builds, if I make that a thing
    regex._identifyState = identifyState;

    /** catchall state - generally, when I don't know what to make of a thing, but also, that it doesn't matter anyway */
    var STATE_TERM = 'STATE_TERM';
    /** catchall group state - when I know I have some kind of group, but don't care what type */
    var STATE_CLOSEDGROUP = 'STATE_CLOSEDGROUP';
    /** literally empty */
    var STATE_EMPTY = 'STATE_EMPTY';
    /** last token is non empty and included an | symbol */
    var STATE_OR = 'STATE_OR';
    /** see or.js testcases - a(?:b|c) is an open noncaptured group - but if user tries to capture right after that, minimal regex demands we replace the noncapture with a capture */
    var STATE_OPENNONCAPTURE = 'STATE_OPENNONCAPTURE';
    /** like *, or {}, or ? after a term */
    var STATE_MODIFIEDTERM = 'STATE_MODIFIEDTERM';
    var STATE_CHARACTER = 'STATE_CHARACTER';
    var STATE_CAPTURE = 'STATE_CAPTURE';
    var STATE_REPEAT = 'STATE_REPEAT';
    var STATE_FOLLOWEDBY = 'STATE_FOLLOWEDBY';
    var STATE_OPTIONAL = 'STATE_OPTIONAL';

    return regex;
}));

