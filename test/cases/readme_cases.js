
/*global regex */

module('Readme examples');

test('API Demonstration', function () {

    var result;

    result = regex()
        .literals('abc')
        .peek();

    strictEqual(result, 'abc', 'Simple abc');

    regex()
        .literals('abc')
        .call(function (curNode) {
            ok(this === curNode, 'call uses both this and first func arg');
            strictEqual(curNode.peek(), 'abc', 'Still just abc');
        })
        .literals('def')
        .call(function (curNode) {
            strictEqual(curNode.peek(), 'abcdef', 'Added def');
        });

    result = regex()
        .f.digit()
        .f.whitespace()
        .peek();

    strictEqual(result, '\\d\\s', 'Basic flags');

    result = regex()
        .literals('aaa')
          .capture()
        .peek();

    strictEqual(result, '(aaa)', 'capture()');

    result = regex()
        .literals('aaa')
        .call(function (curNode) {
            strictEqual(curNode.peek(), 'aaa', 'Simple aaa before repeat');
        })
          .repeat(1, 3)
        .peek();

    strictEqual(result, '(?:aaa){1,3}', 'repeat(1, 3)');

    result = regex()
        .sequence()
            .literals('aaa')
            .f.digit()
            .literals('bbb')
        .close()
          .repeat()
        .peek();

    strictEqual(result, '(?:aaa\\dbbb)*', 'Simple grouping');

    result = regex()
        .any('abcdefg')
        .peek();

    strictEqual(result, '[abcdefg]', 'any()');

    result = regex()
        .any()
            .literals('abc')
            .f.digit()
        .close()
        .peek();

    strictEqual(result, '[abc\\d]', 'any() with f.digit()');

    result = regex()
        .none()
            .literals('abc')
            .f.whitespace()
        .close()
        .peek();

    strictEqual(result, '[^abc\\s]', 'none()');

    result = regex()
        .or()
            .literals('abc')
            .literals('def')
        .close()
        .peek();

    strictEqual(result, 'abc|def', 'or()');

    result = regex.create();

    ok(result, 'regex.create() returns something');

    result = regex
        .addMacro('any-quote')
            .any('\'"')
        .close()
        .create()
            .macro('any-quote')
            .f.dot()
              .repeat()
            .macro('any-quote')
            .peek();

    strictEqual(result, '[\'"].*[\'"]', 'any-quote macro');

    result = regex
        .addMacro('quote')
            .any('\'"')
        .close()
        .create()
            .addMacro('quote')
                .literal('"')
            .close()
            .macro('quote')
            .f.dot()
              .repeat()
            .macro('quote')
            .peek();

    strictEqual(result, '".*"', 'local macros override global');

    result = regex()
        .literals('aaa')
          .followedBy('bbb')
        .peek();

    strictEqual(result, '(?:aaa)(?=bbb)', 'followedBy()');

    result = regex()
        .literals('ccc')
          .notFollowedBy('ddd')
        .peek();

    strictEqual(result, '(?:ccc)(?!ddd)', 'notFollowedBy()');

});

test('Complex Examples', function () {

    var result = '';

    result = regex()
        .addMacro('0-255')
            .or()
                .sequence()
                    .literals('25')
                    .anyFrom('0', '5')
                .close()
                .sequence()
                    .literal('2')
                    .anyFrom('0', '4')
                    .anyFrom('0', '9')
                .close()
                .sequence()
                    .any('01').optional()
                    .anyFrom('0', '9')
                    .anyFrom('0', '9').optional()
                .close()
            .close()
        .close()
        .macro('0-255').capture()
        .literal('.')
        .macro('0-255').capture()
        .literal('.')
        .macro('0-255').capture()
        .literal('.')
        .macro('0-255').capture()
        .peek();

    // http://www.regular-expressions.info/examples.html
    var ipAddrRegex = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
    strictEqual(result, ipAddrRegex, 'IP Address Regex');

    result = regex()
        .addMacro('dept-prefix')
            .or()
                .literals('SH')
                .literals('RE')
                .literals('MF')
            .close()
        .close()
        .addMacro('date')
            .or()
                .sequence()
                    .literals('197')
                    .anyFrom('1', '9')
                .close()
                .sequence()
                    .literals('19')
                    .any('89')
                    .f.digit()
                .close()
                .sequence()
                    .anyFrom('2', '9')
                    .f.digit().repeat(3, 3)
                .close()
            .close()
            .literal('-')
            .or()
                .sequence()
                    .literal('0')
                    .anyFrom('1', '9')
                .close()
                .sequence()
                    .literal('1')
                    .any('012')
                .close()
            .close()
            .literal('-')
            .or()
                .sequence()
                    .literal('0')
                    .anyFrom('1', '9')
                .close()
                .sequence()
                    .any('12')
                    .f.digit()
                .close()
                .sequence()
                    .literal('3')
                    .any('01')
                .close()
            .close()
        .close()
        .addMacro('issuenum')
            .notFollowedBy()
                .literal('0')
                .repeat(5, 5)
            .close()
            .f.digit()
            .repeat(5, 5)
        .close()
        .macro('dept-prefix').capture()
        .literal('-')
        .macro('date').capture()
        .literal('-')
        .macro('issuenum').capture()
        .peek();

    var businessLogicRegex = '(SH|RE|MF)-((?:197[1-9]|19[89]\\d|[2-9]\\d{3})-(?:0[1-9]|1[012])-(?:0[1-9]|[12]\\d|3[01]))-((?!0{5})\\d{5})';

    strictEqual(result, businessLogicRegex, 'Business-like logic regex');

});

