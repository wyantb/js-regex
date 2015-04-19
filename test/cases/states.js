/*global test,ok,regex,strictEqual,module*/

module('direct state tests');

test('has the fn', function () {
    'use strict';
    ok(regex._identifyState);
});

test('basic states', function () {
    'use strict';
    strictEqual(regex._identifyState(''), 'STATE_EMPTY');
    strictEqual(regex._identifyState('a'), 'STATE_CHARACTER');
});

test('((ab){2}) gives closedgroup state', function () {
    'use strict';
    strictEqual(regex._identifyState('((ab){2})'), 'STATE_CLOSEDGROUP');
});
