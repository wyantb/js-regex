
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        uglify: {
            options: {
                sourceMap: 'regex.min.map',
                preserveComments: 'some',
            },
            'regex.min.js': 'regex.js'
        },
        qunit: {
            all: 'test/index.html'
        },
        jshint: {
            all: ['**/*.js', '!test/resources/**', '!node_modules/**']
        },
    });

    grunt.registerTask('default', [
        'jshint',
        'qunit',
        'quick_node_check'
    ]);

    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');

};

