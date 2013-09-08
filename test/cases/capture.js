
module('Capture tests');

test('Basic usage', function () {
    var result;

    result = regex()
        .literals('a').capture('theA')
        .literals('b').capture('theB')
        .exec('ab');

    strictEqual(result.result, 'ab', 'whole result captured');
    strictEqual(result.theA, 'a', 'partial capture - a');
    strictEqual(result.theB, 'b', 'partial capture - b');

});

