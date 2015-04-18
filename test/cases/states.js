/*global test,ok,regex,strictEqual,notStrictEqual,module*/

module('direct state tests');

test('has the fn', function () {
    'use strict';
    ok(regex._identifyState);
});

test('basic states', function () {
    'use strict';
    strictEqual(regex._identifyState(''), 'STATE_EMPTY');
    strictEqual(regex._identifyState('a'), 'STATE_CHARACTER');
    strictEqual(regex._identifyState('abc'), 'STATE_TERM');
});

test('((ab){2}) gives closedgroup state', function () {
    'use strict';
    strictEqual(regex._identifyState('((ab){2})'), 'STATE_CLOSEDGROUP');
});

test('more complex - or states', function () {
    'use strict';
    notStrictEqual(regex._identifyState('c(a|b)'), 'STATE_OR', 'stuff before');
    notStrictEqual(regex._identifyState('(a|b)c'), 'STATE_OR', 'stuff after');
    strictEqual(regex._identifyState('a|b'), 'STATE_OR', 'simplest case');
    strictEqual(regex._identifyState('\\(a|b\\)'), 'STATE_OR', 'duds before/after');
    notStrictEqual(regex._identifyState('(\\(a|b\\))'), 'STATE_OR', 'pseudo duds before/after');
});
