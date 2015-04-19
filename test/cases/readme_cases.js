/*global regex,test,strictEqual,ok,module*/

module('Readme examples');

test('API Demonstration', function () {
    'use strict';

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

    result = regex().sequence('aaa', regex.flags.digit(), 'bbb')
        .repeat()
        .peek();            // Will return '(?:aaa\dbbb)*'

    strictEqual(result, '(?:aaa\\dbbb)*', 'Simple grouping, alt form');

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
        .either()
            .literals('abc')
            .literals('def')
        .endEither()
        .peek();             // Will return 'abc|def'

    strictEqual(result, 'abc|def', 'either()');

    result = regex()
        .either('abc', regex.any('def'))
        .peek();             // Will return 'abc|[def]'

    strictEqual(result, 'abc|[def]', 'either(lit, any(lit))');

    //### Macros

    result = regex.create(); // Alternate form of regex()

    ok(result, 'regex.create() returns something');

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
        .peek();            // Will return 'aaa(?=bbb)'

    strictEqual(result, 'aaa(?=bbb)', 'followedBy()');

    result = regex()
        .literals('ccc')
          .notFollowedBy('ddd')
        .peek();               // Will return 'ccc(?!ddd)

    strictEqual(result, 'ccc(?!ddd)', 'notFollowedBy()');
});

test('Named Capture Groups & Exec', function () {
    'use strict';
    regex()
        .flags.anything()
          .repeat()
          .capture('preamble')
        .either('cool!', 'awesome!')
        .call(function (rb) {
            strictEqual(rb.peek(), '(.*)(?:cool!|awesome!)');
        })
          .capture('exclamation')
        .call(function (rb) {
            strictEqual(rb.peek(), '(.*)(cool!|awesome!)');
            strictEqual(rb.exec('this is cool!  isn\'t it?').match, 'this is cool!');
            strictEqual(rb.exec('this is cool!  isn\'t it?').preamble, 'this is ');
            strictEqual(rb.exec('this is cool!  isn\'t it?').exclamation, 'cool!');

            strictEqual(rb.exec('this is also awesome!').match, 'this is also awesome!');
            strictEqual(rb.exec('this is also awesome!').preamble, 'this is also ');
            strictEqual(rb.exec('this is also awesome!').exclamation, 'awesome!');
        });
});

test('Named Backreferences', function () {
    'use strict';
    regex()
        .flags.anything()
          .repeat(1)
          .capture('anything')
        .literal('-')
        .reference('anything')
        .call(function (rb) {
            strictEqual(rb.peek(), '(.+)-\\1');
            strictEqual(rb.exec('whatever-whatever').anything, 'whatever');
            ok(!rb.test('whatever-whatev'));
        });
});

test('Complex Examples', function () {
    'use strict';

    var result = '';

    //### Example 1

    var portionWithoutQuotes = '25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?';
    var portionWithQuotes = '(' + portionWithoutQuotes + ')';
    result = regex()
        .addMacro('0-255')
            .either()
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
            .endEither()
        .endMacro()
        .macro('0-255')
        .call(function (rb) {
            strictEqual(rb.peek(), portionWithoutQuotes, 'invoking macro gave nice rendering');
        })
          .capture()
        .call(function (rb) {
            strictEqual(rb.peek(), portionWithQuotes, 'and got captured the same');
        })
        .literal('.')
        .call(function (rb) {
            strictEqual(rb.peek(), portionWithQuotes + '\\.', 'and didnt go crazy once a literal was added');
        })
        .macro('0-255')
        .call(function (rb) {
            var peeked = rb.peek();
            strictEqual(peeked, portionWithQuotes + '\\.(?:' + portionWithoutQuotes + ')', 'and once second macro was added, appended in straightforward manner (though, it is a temporary TYPE_OR condition)');
        })
          .capture()
        .call(function (rb) {
            var peeked = rb.peek();
            strictEqual(peeked, portionWithQuotes + '\\.' + portionWithQuotes, 'same with second capture');
        })
        .literal('.')
        .call(function (rb) {
            var peeked = rb.peek();
            strictEqual(peeked, portionWithQuotes + '\\.' + portionWithQuotes + '\\.', 'same with second literal');
        })
        .macro('0-255').capture()
        .literal('.')
        .macro('0-255').capture()
        .peek();

    // http://www.regular-expressions.info/examples.html
    var ipAddrRegex = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
    strictEqual(result, ipAddrRegex, 'IP Address Regex');

    result = regex
        .addMacro('0-255',
            regex.either(
                regex.sequence(
                    '25',
                    regex.anyFrom('0', '5')),
                regex.sequence(
                    '2',
                    regex.anyFrom('0', '4'),
                    regex.anyFrom('0', '9')),
                regex.sequence(
                    regex.any('01').optional(),
                    regex.anyFrom('0', '9'),
                    regex.anyFrom('0', '9').optional())))
        .create()
        .sequence(
            regex.macro('0-255').capture(),
            '.',
            regex.macro('0-255').capture(),
            '.',
            regex.macro('0-255').capture(),
            '.',
            regex.macro('0-255').capture())
        .peek();

    strictEqual(result, ipAddrRegex, 'IP Address, Alternate usage form');

    //UNLISTED

    result = regex()
        .addMacro('dept-prefix')
            .either()
                .literals('SH')
                .literals('RE')
                .literals('MF')
            .endEither()
            .call(function (rb) {
                strictEqual(rb.peek(), 'SH|RE|MF');
            })
        .endMacro()
        .addMacro('date')
            .either()
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
            .endEither()
            .literal('-')
            .either()
                .sequence()
                    .literal('0')
                    .anyFrom('1', '9')
                .endSequence()
                .sequence()
                    .literal('1')
                    .any('012')
                .endSequence()
            .endEither()
            .literal('-')
            .either()
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
            .endEither()
            .call(function (rb) {
                strictEqual(rb.peek(), '(?:197[1-9]|19[89]\\d|[2-9]\\d{3})-(?:0[1-9]|1[012])-(?:0[1-9]|[12]\\d|3[01])', 'date portion of the overall macro');
            })
        .endMacro()
        .addMacro('issuenum')
            .notFollowedBy()
                .literal('0')
                .repeat(5, 5)
            .endNotFollowedBy()
            .f.digit()
            .repeat(5, 5)
            .call(function (rb) {
                strictEqual(rb.peek(), '(?!0{5})\\d{5}', 'issue number portion');
            })
        .endMacro()
        .macro('dept-prefix').capture()
        .literal('-')
        .macro('date').capture()
        .literal('-')
        .macro('issuenum').capture()
        .peek();

    var businessLogicRegex = '(SH|RE|MF)-((?:197[1-9]|19[89]\\d|[2-9]\\d{3})-(?:0[1-9]|1[012])-(?:0[1-9]|[12]\\d|3[01]))-((?!0{5})\\d{5})';

    strictEqual(result, businessLogicRegex, 'Business-like logic regex');

    result = regex
        // Setting up our macros...
        .addMacro('dept-prefix', regex.either('SH', 'RE', 'MF'))
        .addMacro('date',
            regex.either(
                regex.sequence(
                    '197',
                    regex.anyFrom('1', '9')),
                regex.sequence(
                    '19',
                    regex.any('89'),
                    regex.flags.digit()),
                regex.sequence(
                    regex.anyFrom('2', '9'),
                    regex.flags.digit().repeat(3, 3))),
            '-',
            regex.either(
                regex.sequence(
                    '0',
                    regex.anyFrom('1', '9')),
                regex.sequence(
                    '1',
                    regex.any('012'))),
            '-',
            regex.either(
                regex.sequence(
                    '0',
                    regex.anyFrom('1', '9')),
                regex.sequence(
                    regex.any('12'),
                    regex.flags.digit()),
                regex.sequence(
                    '3',
                    regex.any('01'))))
        .addMacro('issuenum',
            regex.notFollowedBy()
                .literal('0')
                    .repeat(5, 5),
            regex.flags.digit()
                .repeat(5, 5))
        // Macros are setup, let's create our actual regex now:
        .create()
            .macro('dept-prefix').capture()
            .literal('-')
            .macro('date').capture()
            .literal('-')
            .macro('issuenum').capture()
            .peek(); // Returns the string shown above this code example

    strictEqual(result, businessLogicRegex, 'Business-like logic regex, alternate usage form');

});

