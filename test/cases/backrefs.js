/*global test,regex,strictEqual,module,ok*/

module('backrefs');

test('can add backref in simplet case', function () {
    'use strict';
    regex()
        .literals('lit')
          .capture('group')
        .reference('group')
        .call(function (rb) {
            strictEqual(rb.peek(), '(lit)\\1');
        });
});

test('can get actual idx of capture', function () {
    'use strict';
    regex()
        .literals('a').capture('g1')
        .literals('b').capture('g2')
        .reference('g2')
        .call(function (rb) {
            strictEqual(rb.peek(), '(a)(b)\\2');
            strictEqual(rb.exec('abb').g2, 'b');
            ok(rb.test('abb'));
            ok(!rb.test('aba'));
            ok(!rb.test('ab'));
        });
});
