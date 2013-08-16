
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
        .start()
            .literal('a')
        .close()
        .repeat()
        .peek();

    strictEqual(result, 'a*', 'a*');

    result = regex()
        .start()
            .literal('a')
            .literal('b')
        .close()
        .repeat()
        .peek();

    strictEqual(result, '(?:ab)*', '(?:ab)*');

    result = regex()
        .start()
            .literal('a')
            .or()
                .literals('abc')
                .literals('abc')
            .close()
        .close()
        .repeat()
        .peek();

    strictEqual(result, '(?:a(?:abc|abc))*', 'start() with a literal() and or()');

    result = regex()
        .start()
            .or()
                .literals('abc')
                .literals('bcd')
            .close()
        .close()
        .repeat()
        .peek();

    strictEqual(result, '(?:abc|bcd)*', 'start() with just an or()');

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
        .close()
        .repeat()
        .peek();

    strictEqual(result, '[\\dab]*', 'slightly more interesting any()');

    result = regex()
        .none()
            .f.digit()
            .literals('ab')
        .close()
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
        .close();

    result = regex()
        .macro('lits')
        .repeat()
        .peek();

    strictEqual(result, '(?:lits)*', 'simple literals macro');

    regex.addMacro('lit')
            .literal('l')
        .close();

    result = regex()
        .macro('lit')
        .repeat()
        .peek();

    strictEqual(result, 'l*', 'simple literal macro');

    result = regex()
        .start()
            .macro('lits')
            .macro('lit')
            .macro('lits')
        .close()
        .repeat()
        .peek();

    strictEqual(result, '(?:litsllits)*', 'combo macros with start()');

    regex.addMacro('or')
            .or()
                .literals('abc')
                .literals('def')
            .close()
        .close();

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
            .close()
        .close();

    result = regex()
        .macro('followedBy')
        .repeat()
        .peek();

    strictEqual(result, '(?:(?:abc)(?=def))*', 'followedBy() based macro');

});
