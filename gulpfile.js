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

gulp.task('default',['deserialize_binary','create_binary']);