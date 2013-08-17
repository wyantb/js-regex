
module('repeat() tests');

test('basics', function () {

    var result;

    result = regex()
        .literals('abc')
        .repeat()
        .peek();

    strictEqual(result, '(?:abc)*');

    result = regex()
        .literals('abc')
        .repeat(2)
        .peek();

    strictEqual(result, '(?:abc){2,}');

    result = regex()
        .literals('abc')
        .repeat(2, 2)
        .peek();

    strictEqual(result, '(?:abc){2}');

    result = regex()
        .literals('abc')
        .repeat(0)
        .peek();

    strictEqual(result, '(?:abc)*');

    result = regex()
        .literals('abc')
        .repeat(1)
        .peek();

    strictEqual(result, '(?:abc)+');

    result = regex()
        .literal('a')
        .repeat()
        .peek();

    strictEqual(result, 'a*');

});

test('preceded by every token', function () {

    var result;

    result = regex()
        .literals('aaa').capture()
        .repeat()
        .peek();

    strictEqual(result, '(aaa)*', '(aaa)*');

    result = regex()
        .literal('a').capture()
        .repeat()
        .peek();

    strictEqual(result, '(a)*', '(a)*');

    try {
        result = regex()
            .literal('a')
            .capture().capture();
        ok(false, 'didn\'t throw an exception.');
    } catch (err) {
        ok(true, 'threw an exception when attempting two times in a row.');
    }

    result = regex()
        .sequence()
            .literal('a')
        .endSequence()
        .repeat()
        .peek();

    strictEqual(result, 'a*', 'a*');

    result = regex()
        .sequence()
            .literal('a')
            .literal('b')
        .endSequence()
        .repeat()
        .peek();

    strictEqual(result, '(?:ab)*', '(?:ab)*');

    result = regex()
        .sequence()
            .literal('a')
            .or()
                .literals('abc')
                .literals('abc')
            .endOr()
        .endSequence()
        .repeat()
        .peek();

    strictEqual(result, '(?:a(?:abc|abc))*', 'sequence() with a literal() and or()');

    result = regex()
        .sequence()
            .or()
                .literals('abc')
                .literals('bcd')
            .endOr()
        .endSequence()
        .repeat()
        .peek();

    strictEqual(result, '(?:abc|bcd)*', 'sequence() with just an or()');

    result = regex()
        .f.digit()
        .repeat()
        .peek();

    strictEqual(result, '\\d*', 'simple star flag');

    result = regex()
        .flags('sd')
        .repeat()
        .peek();

    strictEqual(result, '(?:\\s\\d)*', 'two flags starred');

    result = regex()
        .any('abc')
        .repeat()
        .peek();

    strictEqual(result, '[abc]*', 'simple any()');

    result = regex()
        .any()
            .f.digit()
            .literals('ab')
        .endAny()
        .repeat()
        .peek();

    strictEqual(result, '[\\dab]*', 'slightly more interesting any()');

    result = regex()
        .none()
            .f.digit()
            .literals('ab')
        .endNone()
        .repeat()
        .none('abc')
        .repeat()
        .peek();

    strictEqual(result, '[^\\dab]*[^abc]*', 'double usage of none');

});

test('with macros', function () {

    var result;

    regex.addMacro('lits')
            .literals('lits')
        .endMacro();

    result = regex()
        .macro('lits')
        .repeat()
        .peek();

    strictEqual(result, '(?:lits)*', 'simple literals macro');

    regex.addMacro('lit')
            .literal('l')
        .endMacro();

    result = regex()
        .macro('lit')
        .repeat()
        .peek();

    strictEqual(result, 'l*', 'simple literal macro');

    result = regex()
        .sequence()
            .macro('lits')
            .macro('lit')
            .macro('lits')
        .endSequence()
        .repeat()
        .peek();

    strictEqual(result, '(?:litsllits)*', 'combo macros with sequence()');

    regex.addMacro('or')
            .or()
                .literals('abc')
                .literals('def')
            .endOr()
        .endMacro();

    result = regex()
        .macro('or')
        .repeat()
        .macro('lits')
        .repeat()
        .peek();

    strictEqual(result, '(?:abc|def)*(?:lits)*', 'or() and lits macro combined');

    regex.addMacro('followedBy')
            .literals('abc')
            .followedBy()
                .literals('def')
            .endFollowedBy()
        .endMacro();

    result = regex()
        .macro('followedBy')
        .repeat()
        .peek();

    strictEqual(result, '(?:(?:abc)(?=def))*', 'followedBy() based macro');

});
