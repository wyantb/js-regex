
/*global test,strictEqual,ok,regex*/

module('Capture tests');

test('Basic usage', function () {
    'use strict';

    var result;

    result = regex()
        .literals('a').capture('theA')
        .literals('b').capture('theB')
        .exec('ab');

    strictEqual(result.result, 'ab', 'whole result captured');
    strictEqual(result.theA, 'a', 'partial capture - a');
    strictEqual(result.theB, 'b', 'partial capture - b');

    try {
        result = regex()
            .literals('aaa').capture('first').capture('second')
            .exec('aaa');
        ok(false);
    } catch (err) {
        ok(true, 'Capturing twice in a row is pointless.');
    }

    result = regex()
        .literals('aa').capture('first')
          .repeat().capture('second')
        .exec('aaaaaa');

    strictEqual(result.result, 'aaaaaa', 'whole result captured');
    strictEqual(result.first, 'aa', 'partial capture - aa');
    strictEqual(result.second, 'aaaaaa', 'full capture - aaaaaa');

    result = regex()
        .literals('ab').capture('first')
          .repeat(2, 2).capture('second')
          .repeat(2, 2).capture('third')
        .exec('abababab');

    strictEqual(result.result, 'abababab', 'whole result captured');
    strictEqual(result.first, 'ab', 'partial capture - ab');
    strictEqual(result.second, 'abab', 'partial capture - abab');
    strictEqual(result.third, 'abababab', 'full capture - abababab');

    // .sequence(...capture(2)).capture(1)
    // .either(...capture(2)).capture(1)

});

