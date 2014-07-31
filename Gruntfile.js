'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['./*.js', 'routes/*.js', 'models/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'express:dev'],
        options: {
          spawn: false
        }
      },
    },
    express: {
      dev: {
        options: {
          script: './bin/www'
        }
      },
      prod: {
        options: {
          script: './bin/www',
          node_env: 'production'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('server', [ 'express:dev', 'watch' ]);

};
