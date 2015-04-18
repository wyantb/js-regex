/*global test,regex,strictEqual,module,ok*/

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

test('any() from dash to slash escapes them', function () {
    'use strict';

    regex()
        .anyFrom('-', '/')
        .call(function (rb) {
            strictEqual(rb.peek(), '[\\--/]');
            ok(rb.test('.'), 'ascii for period is between dash and /, so should test for it correctly');
        });
});
