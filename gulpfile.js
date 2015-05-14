'use strict';

var del = require('del');
var gulp = require('gulp');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var autoprefixer = require('autoprefixer-core');
var postcss = require('gulp-postcss');
var postcssNested = require('postcss-nested');
var ghPages = require('gulp-gh-pages');
 
var reload = browserSync.reload;

var BROWSERSYNC_PORT = parseInt(process.env.PORT) || 1111;
var BROWSERSYNC_HOST = process.env.IP || "127.0.0.1";

gulp.task('clean', del.bind(null, ['./build']));

gulp.task('css', function() {
  return gulp.src('web/**/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([
      postcssNested,
      autoprefixer({ browsers: ['last 2 version'] })
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./build/'))
    .pipe(reload({stream: true}));
});

gulp.task('scripts', function() {
  var bundler = browserify({
    entries: ['./web/js/main.js'],
    debug: true
  });
  return bundler
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build/js/'))
    .pipe(reload({stream: true}));
});

gulp.task('html', function() {
  gulp.src('./web/*.html')
    .pipe(gulp.dest('./build'))
    .pipe(reload({stream: true}));
});

gulp.task('serve', ['default'], function() {
  browserSync({
    port: BROWSERSYNC_PORT,
    host: BROWSERSYNC_HOST,
    notify: false,
    server: 'build'
  });

  gulp.watch('./web/js/**/*.js', ['scripts']);
  gulp.watch('./web/**/*.css', ['css']);
  gulp.watch('./web/**/*.html', ['html']);
});

gulp.task('deploy', function() {
  return gulp.src('./build/**/*')
    .pipe(ghPages());
});

gulp.task('default', ['scripts', 'html', "css"]);
