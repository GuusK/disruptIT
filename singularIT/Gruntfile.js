'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      // options: {
      //   jshintrc: '.jshintrc',
      //   reporterOutput: ""
      // },
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
        files: ['<%= jshint.lib.src %>', 'config.json' , 'locales/*/*.*'],
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
    },
    cssmin: {
      target: {
        files: {
          'public/css/style.min.css': ['public/css/style.css']
        }
      }
    },
    uglify: {
      target: {
        files: {
          'public/js/init.min.js': ['public/js/init.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('server', [ 'cssmin', 'uglify', 'express:dev', 'watch' ]);

};
