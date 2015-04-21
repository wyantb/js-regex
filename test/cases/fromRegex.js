/*global test,regex,strictEqual,module*/

module('fromRegex');

test('simple RegExp', function () {
    'use strict';
    regex()
        .regex(/abc/)
        .call(function (rb) {
            strictEqual(rb.peek(), 'abc');
        });
});
