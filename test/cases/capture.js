
/*global test,strictEqual,ok,regex*/

module('Capture tests');

test('Basic usage', function () {
    'use strict';

    var result;

    result = regex()
        .literals('a').capture('theA')
        .literals('b').capture('theB')
        .exec('ab');

    strictEqual(result.match, 'ab', 'whole result captured');
    strictEqual(result.theA, 'a', 'partial capture - a');
    strictEqual(result.theB, 'b', 'partial capture - b');

    result = regex()
        .literals('aa').capture('first')
          .repeat().capture('second')
        .call(function (regb) {
            strictEqual(regb.peek(), '((aa)*)', 'generated nicely nested regex');
        })
        .exec('aaaaaa');

    strictEqual(result.match, 'aaaaaa', 'whole result captured');
    strictEqual(result.first, 'aa', 'partial capture - aa');
    strictEqual(result.second, 'aaaaaa', 'full capture - aaaaaa');

    result = regex()
        .literals('ab').capture('first')
          .repeat(2, 2).capture('second')
          .repeat(2, 2).capture('third')
        .exec('abababab');

    strictEqual(result.match, 'abababab', 'whole result captured');
    strictEqual(result.first, 'ab', 'partial capture - ab');
    strictEqual(result.second, 'abab', 'partial capture - abab');
    strictEqual(result.third, 'abababab', 'full capture - abababab');

    result = regex()
        .literals('123')
        .literals('abc').capture('inner')
          .repeat().capture('outer')
        .exec('123abcabcabc');

    strictEqual(result.match, '123abcabcabc', 'whole string captured in match');
    strictEqual(result.inner, 'abc', 'grabbed non-repeated inner portion');
    strictEqual(result.outer, 'abcabcabc', 'grabbed repeated outer portion exactly');
});

// TODO honestly, I should be generating more minimal test cases than this.  You want to debug this thing?
test('with a sequence, lots of edge cases in one shot', function () {
    'use strict';

    var result;
    var partialBuilt;

    partialBuilt = regex()
        .literals('QUEL').capture('startbit')
        .sequence()
            .literals('abc').capture('sequence-1')
            .literals('def').capture('sequence-2')
        .endSequence()
        .call(function (rb) {
            strictEqual(rb.peek(), '(QUEL)(abc)(def)', 'generated both captures in the sequence');
        });

    result =
        partialBuilt.clone()
          .capture('wholeseq')
        .call(function (rb) {
            strictEqual(rb.peek(), '(QUEL)((abc)(def))', 'and further, generated the repeat and capture group');
        })
        .literals('POST')
        .exec('PREQUELabcdefPOSTQUEL');

    strictEqual(result.match, 'QUELabcdefPOST', 'grabbed relevant parts defined by sequence, literals');
    strictEqual(result.startbit, 'QUEL', 'grabbed precursor to sequence');
    strictEqual(result['sequence-1'], 'abc', 'grabbed first part from sequence');
    strictEqual(result['sequence-2'], 'def', 'grabbed second part from sequence');
    strictEqual(result.wholeseq, 'abcdef', 'wholeseq got the repeated part');

    result =
        partialBuilt.clone()
          .repeat().capture('repeated')
        .call(function (rb) {
            strictEqual(rb.peek(), '(QUEL)((?:(abc)(def))*)', 'generated proper capture/non-capture groups');
        })
        .exec('QUELabcdefabcdef');

    strictEqual(result.match, 'QUELabcdefabcdef', 'variant2 | grabbed relevant parts defined by sequence, literals');
    strictEqual(result.startbit, 'QUEL', 'variant2 | grabbed precursor to sequence');
    strictEqual(result['sequence-1'], 'abc', 'variant2 | grabbed first part from sequence');
    strictEqual(result['sequence-2'], 'def', 'variant2 | grabbed second part from sequence');
    strictEqual(result.repeated, 'abcdefabcdef', 'variant2 | wholeseq got the repeated part');

    // .sequence(...capture(2)).capture(1)
    // .either(...capture(2)).capture(1)

});

test('capturing eithers and before/after', function () {
    'use strict';

    var result;

    result = regex()
        .literals('1').capture('prequel')
        .either()
            .literals('a').capture('theA')
            .literals('b').capture('theB')
        .endEither()
        .call(function (rb) {
            strictEqual(rb.peek(), '(1)(?:(a)|(b))');
        })
        .exec('b1a');

    strictEqual(result.match, '1a');
    strictEqual(result.prequel, '1');
    strictEqual(result.theA, 'a');
    strictEqual(result.theB, undefined);
});

test('Banned uses', function () {
    'use strict';

    try {
        regex()
            .literals('aaa').capture('first').capture('second')
            .exec('aaa');
        ok(false);
    } catch (err) {
        ok(true, 'Capturing twice in a row is pointless.');
    }

    try {
        regex().literal('a').capture('match');
        ok(false, 'should have failed');
    } catch (err) {
        ok(true, 'Cannot use \'match\' capture group, as that is special');
    }
});

