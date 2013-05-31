module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      my_target: {
        files: {
          'js/easyzoom.min.js': ['js/easyzoom.js']
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'js/easyzoom.js'],
      options: {
        trailing: true,
        browser: true
      },
      globals: {
        jQuery: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['jshint', 'uglify']);

};