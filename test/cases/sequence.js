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

test('sequence toTerm preserves term type', function () {
    'use strict';

    regex()
        .sequence(
            regex.either(
                'a',
                'b')
            .call(function (rb) {
                strictEqual(rb.peek(), 'a|b');
            })
        )
        .call(function (rb) {
            strictEqual(rb.peek(), 'a|b');
        })
        .literals('a')
        .call(function (rb) {
            strictEqual(rb.peek(), '(?:a|b)a');
        });
});
