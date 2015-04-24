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

test('from a\\|a doesnt get noncapture', function () {
    'use strict';
    regex()
        .literals('a')
        .regex(/a\|a/)
        .call(function (rb) {
            strictEqual(rb.peek(), 'aa\\|a');
        });
});

test('from(aa) gets noncapture', function () {
    'use strict';
    regex()
        .regex(/aa/)
        .repeat()
        .call(function (rb) {
            strictEqual(rb.peek(), '(?:aa)*');
        });
});

test('from((a)(a)).repeat() gets noncapture', function () {
    'use strict';
    regex()
        .regex(/(?:a)(?:a)/)
        .repeat()
        .call(function (rb) {
            strictEqual(rb.peek(), '(?:(?:a)(?:a))*');
        });
});

// TESTCASE - from([a][a]).repeat() gets noncapture
// TESTCASE - from((a)(a)).capture() gets new capture parens
// TESTCASE - (?:a(?:a|a)) generates something rational
// TESTCASE - from((a), {captures:['a']}) is valid and makes capture group
// TESTCASE - basically the same as above, but backrefs too
