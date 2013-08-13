
module.exports = function(grunt) {
    'use strict';

    // Just a smoke test to make sure it loads in node
    grunt.registerTask('quick_node_check', function () {
        function check(result, expected) {
            if (result !== expected) {
                grunt.fail.warn('result: ' + result + ' was not as expected: ' + expected);
            }
        }

        var result;
        var regex = require('../regex');

        result = regex()
            .literals('aaa')
            .peek();

        check(result, 'aaa');
    });

};
