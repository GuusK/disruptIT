// require('dotenv').config()

const gulp = require('gulp')
const nodemon = require('gulp-nodemon')
const livereload = require('gulp-livereload')
const sass = require('gulp-sass');
const rename = require('gulp-rename');


gulp.task('sass', function () {
    return gulp.src('./assets/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    // .pipe(minifycss())
    .pipe(rename('style.css'))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('js', function () {
    return gulp.src('./assets/js/*.js')
    .pipe(rename('app.js'))
    .pipe(gulp.dest('./public/js'));
});


gulp.task('serve', () => {
    livereload.listen()

    gulp.watch('./assets/scss/*.scss', ['sass']);
    gulp.watch('./assets/js/*.js', ['js']);
    // start express app
    nodemon({
        script: 'bin/www',
        ext: 'js nunjucks',
        ignore: [
            'assets/',
            'public/',
            'node_modules/'
        ],
        env: { NODE_ENV: process.env.NODE_ENV }
    })
    .on('restart', () => {
        gulp
        .src('bin/www')
        .pipe(livereload())
    })
})
