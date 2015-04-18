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

test('used from the root context', function () {
    'use strict';

    regex()
        .sequence(
            'a',
            regex.flags.digit())
        .call(function (rb) {
            strictEqual(rb.peek(), 'a\\d');
        });
});
