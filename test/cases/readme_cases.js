
/*global regex */

module('Readme examples');

test('API Demonstration', function () {

    var result;

    //### Simple usage with peek()

    result = regex()
        .literals('abc')
        .peek();

    strictEqual(result, 'abc', 'Simple abc');

    //### Never stop chaining!

    var firstCall = false, secondCall = false;

    regex()
        .literals('abc')
        .call(function (curNode) {
            firstCall = true;
            ok(this === curNode, 'call uses both this and first func arg');
            strictEqual(curNode.peek(), 'abc', 'Still just abc');
        })
        .literals('def')
        .call(function (curNode) {
            secondCall = true;
            strictEqual(curNode.peek(), 'abcdef', 'Added def');
        });

    ok(firstCall, 'Call was invoked');
    ok(secondCall, 'Second call was invoked');

    //### Special Flags

    result = regex()
        .f.digit()
        .f.whitespace()
        .peek();

    strictEqual(result, '\\d\\s', 'Basic flags');

    //### Capture Groups

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

    //### Simple Grouping

    result = regex()
        .sequence()
            .literals('aaa')
            .f.digit()
            .literals('bbb')
        .endSequence()
          .repeat()
        .peek();            // Will return '(?:aaa\dbbb)*'

    strictEqual(result, '(?:aaa\\dbbb)*', 'Simple grouping');

    //### Character Sets

    result = regex()
        .any('abcdefg')
        .peek();       // Will return '[abcdefg]'

    strictEqual(result, '[abcdefg]', 'any()');

    result = regex()
        .any()
            .literals('abc')
            .f.digit()
        .endAny()
        .peek();            // Will return '[abc\d]'

    strictEqual(result, '[abc\\d]', 'any() with f.digit()');

    result = regex()
        .none()
            .literals('abc')
            .f.whitespace()
        .endNone()
        .peek();            // Will return '[^abc\s]'

    strictEqual(result, '[^abc\\s]', 'none()');

    //### Or

    result = regex()
        .or()
            .literals('abc')
            .literals('def')
        .endOr()
        .peek();            // Will return 'abc|def'

    strictEqual(result, 'abc|def', 'or()');

    result = regex.create(); // Alternate form of regex()

    ok(result, 'regex.create() returns something');

    //### Macros

    result = regex
        .addMacro('any-quote') // Adding a global macro for single or double quote
            .any('\'"')
        .endMacro()
        .create()
            .macro('any-quote')
            .f.dot()
              .repeat()
            .macro('any-quote')
            .peek();           // Will return '['"].*['"]'

    strictEqual(result, '[\'"].*[\'"]', 'any-quote macro');

    result = regex
        .addMacro('quote')
            .any('\'"')
        .endMacro()
        .create()
            .addMacro('quote') // Local macros override global ones
                .literal('"')  //  Here, restricting to double quote only
            .endMacro()
            .macro('quote')
            .f.dot()
              .repeat()
            .macro('quote')
            .peek();           // Will return '".*"'

    strictEqual(result, '".*"', 'local macros override global');

    //### Followed By

    result = regex()
        .literals('aaa')
          .followedBy('bbb')
        .peek();            // Will return '(?:aaa)(?=bbb)'

    strictEqual(result, '(?:aaa)(?=bbb)', 'followedBy()');

    result = regex()
        .literals('ccc')
          .notFollowedBy('ddd')
        .peek();               // Will return '(?:ccc)(?!ddd)

    strictEqual(result, '(?:ccc)(?!ddd)', 'notFollowedBy()');

});

test('Complex Examples', function () {

    var result = '';

    //### Example 1

    result = regex()
        .addMacro('0-255')
            .or()
                .sequence()
                    .literals('25')
                    .anyFrom('0', '5')
                .endSequence()
                .sequence()
                    .literal('2')
                    .anyFrom('0', '4')
                    .anyFrom('0', '9')
                .endSequence()
                .sequence()
                    .any('01').optional()
                    .anyFrom('0', '9')
                    .anyFrom('0', '9').optional()
                .endSequence()
            .endOr()
        .endMacro()
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

    //UNLISTED

    result = regex()
        .addMacro('dept-prefix')
            .or()
                .literals('SH')
                .literals('RE')
                .literals('MF')
            .endOr()
        .endMacro()
        .addMacro('date')
            .or()
                .sequence()
                    .literals('197')
                    .anyFrom('1', '9')
                .endSequence()
                .sequence()
                    .literals('19')
                    .any('89')
                    .f.digit()
                .endSequence()
                .sequence()
                    .anyFrom('2', '9')
                    .f.digit().repeat(3, 3)
                .endSequence()
            .endOr()
            .literal('-')
            .or()
                .sequence()
                    .literal('0')
                    .anyFrom('1', '9')
                .endSequence()
                .sequence()
                    .literal('1')
                    .any('012')
                .endSequence()
            .endOr()
            .literal('-')
            .or()
                .sequence()
                    .literal('0')
                    .anyFrom('1', '9')
                .endSequence()
                .sequence()
                    .any('12')
                    .f.digit()
                .endSequence()
                .sequence()
                    .literal('3')
                    .any('01')
                .endSequence()
            .endOr()
        .endMacro()
        .addMacro('issuenum')
            .notFollowedBy()
                .literal('0')
                .repeat(5, 5)
            .endNotFollowedBy()
            .f.digit()
            .repeat(5, 5)
        .endMacro()
        .macro('dept-prefix').capture()
        .literal('-')
        .macro('date').capture()
        .literal('-')
        .macro('issuenum').capture()
        .peek();

    var businessLogicRegex = '(SH|RE|MF)-((?:197[1-9]|19[89]\\d|[2-9]\\d{3})-(?:0[1-9]|1[012])-(?:0[1-9]|[12]\\d|3[01]))-((?!0{5})\\d{5})';

    strictEqual(result, businessLogicRegex, 'Business-like logic regex');

});

