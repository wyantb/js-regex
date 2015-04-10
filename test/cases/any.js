
/*global test,regex,strictEqual*/

module('any()');

test('any() and none() do not confuse - chars', function () {
    'use strict';

    var actual, expected;

    actual = regex().any('a-d').peek();
    expected = '[a\\-d]';

    strictEqual(actual, expected, '- char should be escaped for any()');

    actual = regex().none('a-d').peek();
    expected = '[^a\\-d]';

    strictEqual(actual, expected, '- char should be escaped for any()');
});
