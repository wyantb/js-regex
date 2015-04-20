/*global test,regex,strictEqual,module,ok*/

module('following');

test('thing Im gonna mention in talk', function () {
    'use strict';
    regex().addMacro('dept-code', regex.either('SH', 'AB', 'DHS'))
        .macro('dept-code').capture('entryDept')
        .literals('->')
        .notFollowedBy().reference('entryDept').end()
        .macro('dept-code').capture('exitDept')
        .call(function (rb) {
            strictEqual(rb.peek(), '(SH|AB|DHS)->(?!\\1)(SH|AB|DHS)');
            ok(!rb.test('SH->SH'));
        });
});
