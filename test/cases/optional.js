/*global test,regex,strictEqual,module*/

module('optional()');

test('non-optional() call doesnt get wrapped unnecessarily', function () {
    'use strict';
    regex()
        .literal('?')
        .repeat(2)
        .call(function (rb) {
            strictEqual(rb.peek(), '\\?{2,}');
        });
});
