var gulp = require("gulp");
var browserify = require("browserify");
var fs = require("fs");


gulp.task('deserialize_binary', () => {
  browserify({
    entries: 'deserialize_binary.js',
    debug: true
  })
  .bundle()
  .pipe(fs.createWriteStream('./dist/deserialize_binary.js'));
});
gulp.task('create_binary', () => {
  browserify({
    entries: 'create_binary.js',
    debug: true
  })
  .bundle()
  .pipe(fs.createWriteStream('./dist/create_binary.js'));
});
gulp.task('request_binary', () => {
  browserify({
    entries: 'request_binary.js',
    debug: true
  })
  .bundle()
  .pipe(fs.createWriteStream('./dist/protobufjs/request_binary.js'));
});
gulp.task('request_static', () => {
  browserify({
    entries: 'request_static.js',
    debug: true
  })
  .bundle()
  .pipe(fs.createWriteStream('./dist/protobufjs/request_static.js'));
});

gulp.task('default',['request_static']);