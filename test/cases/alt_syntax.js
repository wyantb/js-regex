
module('Alternate syntax');

test('Basics', function () {

    var result;

    result = regex()
        .or('abc',
            regex.any('def') )
        .peek();

    strictEqual(result, 'abc|[def]', 'or() with string literal and any()');

});
