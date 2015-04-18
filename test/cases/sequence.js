/*global regex,test,strictEqual,module*/

module('sequence() cases');

test('basic usage', function () {
    'use strict';

    var result;

    result = regex()
        .sequence()
            .literals('abc')
            .call(function (rb) {
                strictEqual(rb.peek(), 'abc');
            })
            .literals('def')
            .call(function (rb) {
                strictEqual(rb.peek(), 'abcdef');
            })
        .endSequence()
        .peek();

    strictEqual(result, 'abcdef');

});
