/*global test,ok,regex,module*/

module('rb.test');

test('can test', function () {
    'use strict';
    ok(regex().literals('a').test('a'));
    ok(!regex().literals('b').test('a'));
});
