const gulp        = require('gulp');
const browserSync = require('browser-sync').create();
const sass        = require('gulp-sass');
const rename      = require('gulp-rename');
const pug         = require('gulp-pug');
const notify      = require('gulp-notify');
const minimist    = require('minimist');
const fs          = require('fs');
const debug       = require('gulp-debug');

const knownOptions = {
  string: 'name'
};

const options = minimist(process.argv.slice(2), knownOptions);

gulp.task('component', () => {
  const name = options.name;

  fs.mkdirSync(`src/components/${name}`);
  fs.mkdirSync(`src/components/${name}/imgs`);
  fs.mkdirSync(`src/components/${name}/fonts`);

  fs.writeFileSync(`src/components/${name}/index.pug`, `include ../common\r\n\r\n+component('${name}')\r\n  .${name}`);
  fs.writeFileSync(`src/components/${name}/index.sass`, `@import ../common\r\n\r\n$component: "${name}"`);

  const pugContent = fs.readFileSync('src/index.pug', {encoding: 'utf8'}).trim();
  fs.writeFileSync('src/index.pug', `${pugContent}\r\n    include components/${name}/index`);
  const sassContent = fs.readFileSync('src/index.sass', {encoding: 'utf8'}).trim();
  fs.writeFileSync('src/index.sass', `${sassContent}\r\n@import components/${name}/index`);
});

gulp.task('init', () => {
  fs.mkdirSync(`src`);
  fs.mkdirSync(`src/components`);

  fs.writeFileSync(`src/index.pug`, `doctype html

html
  head
    link(rel="stylesheet", href="index.css")
    title Untitled
  body
`);

  fs.writeFileSync(`src/index.sass`, '');

  fs.writeFileSync(`src/components/common.pug`, `mixin component(name)
  - var savedComponent = currentComponent
  - currentComponent = name
  block

  - currentComponent = savedComponent`);

  fs.writeFileSync(`src/components/common.sass`, `@function image-path($name)
  @return "imgs/#{$component}_#{$name}"`);
});


gulp.task('serve', ['pug', 'sass', 'images', 'fonts', 'js'], () => {
  browserSync.init({
      server: "./dest"
  });

  gulp.watch("src/**/*.sass", ['rebuild-sass']);
  gulp.watch("src/**/*.pug", ['rebuild-pug']);
  gulp.watch("src/**/imgs/*", ['copy-images']);
  gulp.watch("src/**/fonts/*", ['copy-fonts']);
  gulp.watch("src/*.js", ['copy-js']);
});

gulp.task('sass', () => {
  return gulp.src("src/*.sass")
    .pipe(debug({title: 'DBG sass'}))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest("dest"));
});

global.currentComponent = null;

global.imagePath = (image) => {
  return `imgs/${currentComponent}_${image}`;
};

gulp.task('pug', () => {
  return gulp.src("src/*.pug")
    .pipe(debug({title: 'DBG pug'}))
    .pipe(pug({globals: ['currentComponent', 'imagePath']}).on('error', notify.onError(function (error) {
      return 'An error occurred while compiling pug.\nLook in the console for details.\n' + error;
    })))
    .pipe(gulp.dest("dest"));
});

gulp.task('images', () => {
  return gulp.src("src/**/imgs/*")
    .pipe(debug({title: 'DBG images'}))
    .pipe(rename((path) => {
      const component = path.dirname.replace(/^components\\(.+)\\imgs$/, '$1').replace(/\\/g, '_');
      path.basename = `${component}_${path.basename}`;
      path.dirname = '';
    }))
    .pipe(gulp.dest("dest/imgs"));
});

gulp.task('fonts', () => {
  return gulp.src("src/**/fonts/*")
    .pipe(debug({title: 'DBG fonts'} ))
    .pipe(rename((path) => {
      path.dirname = '';
    }))
    .pipe(gulp.dest("dest/fonts"));
});

gulp.task('js', () => {
  return gulp.src("src/*.js")
    .pipe(debug({title: 'DBG js'} ))
    .pipe(rename((path) => {
      path.dirname = '';
    }))
    .pipe(gulp.dest("dest"));
});

const reload = (done) => {
  console.log('reload browser sync');
  browserSync.reload();
  done();
};

gulp.task('rebuild-sass', ['sass'], reload);
gulp.task('rebuild-pug', ['pug'], reload);
gulp.task('copy-images', ['images'], reload);
gulp.task('copy-fonts', ['fonts'], reload);
gulp.task('copy-js', ['js'], reload);

gulp.task('default', ['serve']);
