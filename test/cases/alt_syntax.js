
module('Alternate syntax');

test('Functions from root', function () {

    var result;

    result = regex
        .any('defg')
        .peek();

    strictEqual(result, '[defg]', 'any() able to be called outside of regex');

    var any = regex.any;

    result = any('defg').peek();

    strictEqual(result, '[defg]', 'any() doesn\'t use this');

});

test('Basics', function () {

    var result;

    result = regex()
        .or('abc', regex.any('def'))
        .peek();

    strictEqual(result, 'abc|[def]', 'or() with string literal and any()');

    result = regex()
        .or().literals('abc').any('def').endOr()
        .peek();

    strictEqual(result, 'abc|[def]', 'or() the plain way');

    result = regex()
        .sequence('abc', 'def').repeat()
        .peek();

    strictEqual(result, '(?:abcdef)*', 'sequence() given two string literals');

    result = regex()
        .sequence('abc', regex.any('def')).repeat()
        .peek();

    strictEqual(result, '(?:abc[def])*', 'sequence() given literal and any()');

});
