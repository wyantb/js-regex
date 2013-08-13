
/*global regex */

module('or() cases');

test('basic usage', function () {

    var result;

    result = regex()
        .or()
            .literals('abc')
            .literals('def')
        .close()
        .peek();

    strictEqual(result, 'abc|def');

});

test('literals before and after', function () {

    var result;

    result = regex()
        .literal('a')
        .or()
            .literal('b')
            .literal('c')
        .close()
        .peek();

    strictEqual(result, 'a(?:b|c)', 'before');

    result = regex()
        .or()
            .literal('b')
            .literal('c')
        .close()
        .literal('d')
        .peek();

    strictEqual(result, '(?:b|c)d', 'after');

    result = regex()
        .literal('a')
        .or()
            .literal('b')
            .literal('c')
        .close()
        .literal('d')
        .peek();

    strictEqual(result, 'a(?:b|c)d', 'both before and after');

});

test('literals before and after, but no wrap needed', function () {

    var result;

    result = regex()
        .literal('a')
        .or()
            .literal('b')
        .close()
        .peek();

    strictEqual(result, 'ab', 'lit before');

    result = regex()
        .or()
            .literal('b')
        .close()
        .literal('c')
        .peek();

    strictEqual(result, 'bc', 'lit after');

    result = regex()
        .literal('a')
        .or()
            .literal('b')
        .close()
        .literal('c')
        .peek();

    strictEqual(result, 'abc', 'lit before and after');
});

