
/*global regex */

module('Readme examples');

test('Readme examples', function () {

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
        .start()
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
