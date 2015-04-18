/*global test,regex,strictEqual,module*/

module('flags');

test('add some basic flags', function () {
    'use strict';

    regex()
        .flags.dot()
        .call(function (rb) {
            strictEqual(rb.peek(), '.');
        })
        .flags.tab()
        .call(function (rb) {
            strictEqual(rb.peek(), '.\\t');
        });

});
