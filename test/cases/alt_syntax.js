
module('Alternate usage patterns');

test('Functions from root', function () {

    var result;

    ok(regex.any, 'regex.any exists');

    result = regex
        .any('defg')
        .peek();

    strictEqual(result, '[defg]', 'any() able to be called outside of regex');

    var any = regex.any;

    result = any('defg').peek();

    strictEqual(result, '[defg]', 'any() doesn\'t use this');

    ok(regex.sequence, 'regex.sequence exists');
    ok(regex.seq === regex.sequence, 'regex.seq is alias for regex.sequence');

    result = regex
        .sequence().literals('a').any('abc').endSequence()
        .peek();

    strictEqual(result, 'a[abc]', 'sequence() able to be called outside of regex');

    var sequence = regex.sequence;

    result = sequence('a', regex.any('abc'))
        .peek();

    strictEqual(result, 'a[abc]', 'sequence() doesn\'t use this');

    ok(regex.or, 'regex.or exists');

    result = regex.or().literals('abc').literals('def').endOr().peek();

    strictEqual(result, 'abc|def', 'or() able to be called outside of regex');

    var or = regex.or;

    result = or('abc', 'def').peek();

    strictEqual(result, 'abc|def', 'or() doesn\'t use this');

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

    result = regex()
        .or('abc', regex.sequence('def', regex.any('ghi')))
        .peek();

    strictEqual(result, 'abc|def[ghi]', 'or(lit, seq(lit, any(lit)))');

    result = regex()
        .sequence('abc', regex.or('def', regex.any('ghi')))
        .peek();

    strictEqual(result, 'abc(?:def|[ghi])', 'seq(lit, or(lit, any(lit)))');

});
