
module.exports = function (grunt) {
    'use strict';

    var jshintOptions = grunt.file.readJSON('.jshintrc');

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
            options: jshintOptions,
            src: 'regex.js',
            tests: 'test/cases/**/*.js'
        },
    });

    grunt.registerTask('default', [
        'jshint',
        'qunit',
        'quick_node_check',
        'uglify'
    ]);

    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');

};

