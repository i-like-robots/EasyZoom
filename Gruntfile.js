module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
        files: [
          {
            src: 'src/easyzoom.js',
            dest: 'dist/easyzoom.js'
          }
        ]
      }
    },
    jshint: {
      all: ['src/**/*.js'],
      options: {
        maxdepth: 4,
        curly: true,
        newcap: true,
        eqeqeq: true,
        browser: true,
        trailing: true,
        globals: {
          jquery: true,
          define: false
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['jshint', 'uglify']);

};