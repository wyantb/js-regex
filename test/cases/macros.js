/*global test,regex,strictEqual,module*/

module('macros');

test('basic macro details with some literals', function () {
    'use strict';

    regex()
        .addMacro('macro')
            .literals('a')
            .call(function (rb) {
                strictEqual(rb.peek(), 'a');
            })
            .literals('b')
            .call(function (rb) {
                strictEqual(rb.peek(), 'ab');
            })
        .endMacro()
        .call(function (rb) {
            strictEqual(rb.peek(), '');
        })
        .macro('macro')
        .call(function (rb) {
            strictEqual(rb.peek(), 'ab');
        });

});
