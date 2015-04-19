/*global test,regex,strictEqual,module*/

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
