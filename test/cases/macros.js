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

test('making a single macro, composed of or, acts like an or', function () {
    'use strict';
    regex()
        .addMacro('macro')
            .either()
                .literals('a')
                .literals('b')
                .call(function (rb) {
                    strictEqual(rb.peek(), 'a|b');
                })
            .endEither()
            .call(function (rb) {
                strictEqual(rb.peek(), 'a|b');
            })
        .endMacro()
        .macro('macro')
        .call(function (rb) {
            strictEqual(rb.peek(), 'a|b');
        })
        .literals('c')
        .call(function (rb) {
            strictEqual(rb.peek(), '(?:a|b)c');
        });
});

test('making two macros, both act nicely', function () {
    'use strict';
    regex()
        .addMacro('m1')
            .literals('a')
        .end()
        .addMacro('m2')
            .literals('b')
        .end()
        .macro('m1').capture()
        .macro('m2').capture()
        .call(function (rb) {
            strictEqual(rb.peek(), '(a)(b)');
        });
});
