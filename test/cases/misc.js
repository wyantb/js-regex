/*global test,regex,module,ok*/

module('miscellaneous tests');

test('call passes along args, too', function () {
    'use strict';
    var t1 = {};
    var t2 = {};
    var re = regex();
    function toTest(rb, test1, test2) {
        ok(t1 === test1);
        ok(t2 === test2);
        ok(rb === re);
    }
    re.call(toTest, t1, t2);
});
