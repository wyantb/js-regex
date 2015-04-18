/*global test,regex,strictEqual,module*/

module('literals');

test('.call and .literals()', function () {
    'use strict';

    regex()
        .literals('a')
        .call(function (rb) {
            strictEqual(rb.peek(), 'a');
        })
        .literals('b')
        .call(function (rb) {
            strictEqual(rb.peek(), 'ab');
        });

});
