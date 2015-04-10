
module('Alternate usage patterns');

test('Functions from root', function () {
    'use strict';

    var result;

    ok(!regex.literal, 'No use for regex.literal function; so doesn\'t exist.');
    ok(!regex.literals, 'No use for regex.literals function; so doesn\'t exist.');

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
    ok(regex.or === regex.either, 'regex.or is alias for regex.either');

    result = regex.or().literals('abc').literals('def').endOr().peek();

    strictEqual(result, 'abc|def', 'or() able to be called outside of regex');

    var or = regex.or;

    result = or('abc', 'def').peek();

    strictEqual(result, 'abc|def', 'or() doesn\'t use this');

    ok(regex.flags, 'regex.flags exists');

    result = regex.flags.digit().peek();

    strictEqual(result, '\\d', 'flags.digit() able to be called outside of regex');

    var flags = regex.flags;

    result = flags('dD').peek();

    strictEqual(result, '\\d\\D', 'flags(...) doesn\'t use this');

    ok(regex.macro, 'regex.macro exists');

    regex.addMacro('pie', 'pie');

    result = regex.macro('pie').peek();

    strictEqual(result, 'pie', 'macro(name) able to be called outside of regex');

    var macro = regex.macro;

    result = macro('pie').peek();

    strictEqual(result, 'pie', 'macro(name) doesn\'t use this');

    ok(regex.followedBy, 'regex.followedBy exists');
    ok(regex.notFollowedBy, 'regex.notFollowedBy exists');

    var followedBy = regex.followedBy;

    result = sequence(followedBy('abc'), regex.notFollowedBy('def')).peek();

    strictEqual(result, '(?=abc)(?!def)', 'can use followedBy/notFollowedBy outside of regex');

    ok(regex.none, 'regex.none exists');
    ok(regex.noneFrom, 'regex.noneFrom exists');
    ok(regex.anyFrom, 'regex.anyFrom exists');

    result = sequence(regex.none('abc'), regex.noneFrom('d', 'f'), regex.anyFrom('a', 'z')).peek();

    strictEqual(result, '[^abc][^d-f][a-z]', 'can use none, noneFrom, anyFrom outside of regex');

});

test('Basics', function () {
    'use strict';

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

    result = regex()
        .sequence('abc', regex.flags('dD'), regex.any('def'))
        .peek();

    strictEqual(result, 'abc\\d\\D[def]', 'seq(lit, flags, any(lit))');

    result = regex()
        .or('abc', regex.flags.digit(), regex.seq('def', 'ghi'))
        .peek();

    strictEqual(result, 'abc|\\d|defghi', 'or(lit, flags.digit(), seq(lit, lit))');

    result = regex()
        .or('abc', regex.flags.digit(), regex.seq('def', 'ghi')).repeat()
        .peek();

    strictEqual(result, '(?:abc|\\d|defghi)*', 'or(lit, flags.digit(), seq(lit, lit)).repeat()');

});
