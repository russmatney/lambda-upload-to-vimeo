var gulp = require('gulp');
var lambduhGulp = require('lambduh-gulp');

lambduhGulp(gulp);

var mocha = require('gulp-mocha');

gulp.task('watch', function() {
  gulp.watch(
    ['*.js', 'test/*.js'],
    ['mocha']
  );
});

gulp.task('mocha', function() {
  process.env.NODE_ENV = 'testing'
  return gulp.src('test/*.spec.js')
    .pipe(mocha())
});

gulp.task('default', ['mocha', 'watch']);
