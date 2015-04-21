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

test('nodes identify their type (via - ors get wrapped)', function () {
    'use strict';
    regex()
        .literals('a')
        .regex(/UNIX|WINDOWS|MAC/)
        .call(function (rb) {
            strictEqual(rb.peek(), 'a(?:UNIX|WINDOWS|MAC)');
        });
});
