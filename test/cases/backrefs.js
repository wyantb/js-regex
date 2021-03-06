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

test('toTerm (closing seqs, eithers, etc) maintains the backref', function () {
    'use strict';
    regex()
        .seq()
            .literals('lit')
              .capture('group')
            .reference('group')
            .call(function (rb) {
                strictEqual(rb.peek(), '(lit)\\1');
            })
        .end()
        .call(function (rb) {
            ok(rb._terms[0].backrefs, 'wheres the backref?');
            strictEqual(rb.peek(), '(lit)\\1');
        });
});

test('capturing a sequence updates backreferences', function () {
    'use strict';
    regex()
        .seq()
            .literals('lit')
              .capture('innerGroup')
            .reference('innerGroup')
            .call(function (rb) {
                strictEqual(rb.peek(), '(lit)\\1');
            })
        .end()
        .capture('outerGroup')
        .call(function (rb) {
            strictEqual(rb.peek(), '((lit)\\2)');
            strictEqual(rb.exec('litlit').innerGroup, 'lit');
            strictEqual(rb.exec('litlit').outerGroup, 'litlit');
        });
});

test('capturing a sequence updates ALL backrefs, for that matter', function () {
    'use strict';
    regex()
        .seq()
            .literals('lit')
              .capture('innerGroup')
            .reference('innerGroup')
            .reference('innerGroup')
            .call(function (rb) {
                strictEqual(rb.peek(), '(lit)\\1\\1');
            })
        .end()
        .capture('outerGroup')
        .call(function (rb) {
            strictEqual(rb.peek(), '((lit)\\2\\2)');
            strictEqual(rb.exec('litlitlit').innerGroup, 'lit');
            strictEqual(rb.exec('litlitlit').outerGroup, 'litlitlit');
        });
});

test('can make a backref to capture groups from parent', function () {
    'use strict';
    regex()
        .literals('prequel').capture('beforeSeq')
        .seq()
            .reference('beforeSeq')
        .end()
        .call(function (rb) {
            strictEqual(rb.peek(), '(prequel)\\1');
        });
});

test('backrefs to parent capture groups dont get updated on capturing', function () {
    'use strict';
    regex()
        .literals('prequel').capture('beforeSeq')
        .seq()
            .reference('beforeSeq')
        .end()
        .call(function (rb) {
            strictEqual(rb.peek(), '(prequel)\\1');
        })
        .capture()
        .call(function (rb) {
            strictEqual(rb.peek(), '(prequel)(\\1)');
        });
});
