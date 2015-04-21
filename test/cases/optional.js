/*global test,regex,strictEqual,module,ok*/

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

test('marking empty obj as optional gives readable error', function () {
    'use strict';
    try {
        regex().optional();
        ok(false, 'regex didnt trigger an error');
    } catch (e) {
        // feel free to change the message - something should do it, though
        strictEqual(e.message, 'nothing to mark as optional');
    }
});
