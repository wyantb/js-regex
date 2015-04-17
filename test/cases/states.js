/*global test,ok,regex,strictEqual,notStrictEqual*/

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

test('more complex - or states', function () {
    'use strict';
    notStrictEqual(regex._identifyState('c(a|b)'), 'STATE_OR');
    notStrictEqual(regex._identifyState('(a|b)c'), 'STATE_OR');
    strictEqual(regex._identifyState('\(a|b\)'), 'STATE_OR');
});
