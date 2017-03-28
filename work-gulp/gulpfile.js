/**
 * gulp mask list
 *
 * gulp-load-plugins
 *
 * babel, less, uglify, browser-sync, del, autoprefixer, concat, minifyCss, rename
 * sourcemaps, inject, notify
 *
 */

const APIURL = 'http://192.168.1.30:6760';

const gulp = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    del = require('del'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    plugins = gulpLoadPlugins(),
    sequence = require('gulp-sequence'),
    gulpCopy = require('gulp-file-copy'),
    proxy = require('http-proxy-middleware');

const DIST = 'dist',
    SRC = './dist';

gulp.task('clean', function () {
   return del(['dist/**/*'])
});

gulp.task('clean-css', function () {
    return del(['dist/css/*.*'])
});

gulp.task('clean-js', function () {
    return del(['dist/js/*.*'])
});


gulp.task('css', function () {
    return gulp.src('./src/less/**/*.less',{base: './src/less'})
        .pipe(plugins.changed(SRC))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.less())
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 version','Android >= 4.0'],
            cascade: true,
            remove: true
        }))
        //.pipe(plugins.concat('main.css'))
        .pipe(plugins.minifyCss())
        .pipe(plugins.rename({suffix: '.min'}))
        //.pipe(plugins.rev())    // 添加md5
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'));
        // .pipe(gulp.rev.manifest())
        // .pipe(gulp.dest('dist/rev'))
});

gulp.task('es6ToEs5', function () {
    return gulp.src('./src/js/**/*.js')
        .pipe(plugins.changed('./src/js/*.js'))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.babel({
            presets: ['es2015']
        }))
        //.pipe(plugins.concat('main.js'))
        .pipe(plugins.uglify())
        .pipe(plugins.rename({suffix: '.min'}))
        //.pipe(plugins.rev())
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('rev',['css'],function() {
    return gulp.src(['dist/rev/rev-manifest.json','dist/*.html'])  //获取rev-manifest.json和要替换的html文件
        .pipe(plugins.revCollector({
            replaceReved: true		//根据rev-manifest.json的规则替换html里的路径，由于替换是根据rev-manifest.json规则来的，所以一定要先生成这个文件再进行替换
        }))
        .pipe(gulp.dest('dist'))
        .pipe(plugins.notify('md5 success!!!!'))
});


gulp.task('copy', function () {
    let start = './src/lib/*.*';
   return gulp.src(start)
       .pipe(plugins.changed(start))
       .pipe(gulpCopy('./dist/lib', {
           start: './src/lib/'
       }))
});

gulp.task('injectFile', [ 'rev', 'es6ToEs5'], function () {
   let target = gulp.src('./src/*.html'),
       sources = gulp.src(['./dist/lib/*.js', './dist/js/*.js', './dist/**/*.css'], {'read': false});
   return target.pipe(plugins.inject(sources, {relative: true}))
       .pipe(gulp.dest('./dist'))
       .pipe(plugins.notify('inject success'))
});


gulp.task('watch', function () {
    return gulp.watch(['./src/less/**/*.less','./src/js/*.js', './src/lib/*.*', './src/*.html'], ['injectFile'])

});

gulp.task('server', function() {
    const aipProxy = proxy('/api', {
        target: APIURL,
        changeOrigin: true,
        ws: true
    });
    browserSync.init({
        files:'**',
        server: {
            baseDir: './',
            middleware: [aipProxy]
        }
    });

    //browserSync.watch('./src/**/*.*').on('change',reload);
    browserSync.watch('./dist/**/*').on('change',reload);
});

gulp.task('default', sequence('clean','copy','injectFile','server', 'watch'));

