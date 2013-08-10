
module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: 'regex.js'
    },
  });

  grunt.registerTask('default', 'jshint');

  grunt.loadNpmTasks('grunt-contrib-jshint');

};

