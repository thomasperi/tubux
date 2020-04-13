const gulp = require('gulp');
const runSequence = require('gulp4-run-sequence');
const watch = require('gulp-watch');
const rename = require('gulp-regex-rename')

const umd = require('gulp-umd');
const pullup = require('@thomasperi/umd-pullup');
const jshint = require('gulp-jshint');
const minify = require('gulp-minify');
const mocha = require('gulp-mocha');
const raiseComments = require('@thomasperi/raise-comments').gulp;

// Patterns for reading files
var files = {
	src: 'src/*.src.js',
	test: 'test/*.js',
	debug: 'dist/*.debug.js',
	min: 'dist/*.min.js'
};

// Directories for writing files
var dir = {
	dist: 'dist'
};

// Make it easier to run tasks from inside other tasks.
var tasks = {},
	buildQueue = [];
function task(name, enqueue, fn) {
	tasks[name] = fn;
	gulp.task(name, fn);
	if (enqueue) {
		buildQueue.push(name);
	}
}

// Universal Module Definition
//
// Adds a wrapper for deciding in real time whether the module needs to be
// defined for AMD, exported for CommonJS (node), or assigned as a property
// to the window object in a browser.
//
// The "pullup" UMD template keeps the library code at the top, preserving
// line numbers for easy reading of the lint messages.
task('umd', true, function() {
	return (gulp
		.src(files.src)
		.pipe(umd({
		'exports': function(file) {
			return '$$';
		},
		'namespace': function(file) {
			return '$$';
		},
		'template': pullup
	}))
		.pipe(rename(/\.src\.js$/, '.debug.js'))
		.pipe(gulp.dest(dir.dist))
	);
});

// Lint the debug file written by the 'umd' task.
task('lint', true, function() {
	return (gulp
		.src(files.debug)
		.pipe(jshint({
			'undef': true
		}))
		.pipe(jshint.reporter('default'))
	);
});

// Minify the debug file and save the result without the .debug extension.
task('min', true, function () {
	return (gulp
		.src(files.debug)
		.pipe(rename(/\.debug\.js$/, '.min.js'))
		.pipe(minify({
			'preserveComments': 'some',
			'noSource': true,
			ext:{
				min:'.js'
			},
		}))
		.pipe(gulp.dest(dir.dist))
	);
});

// Move the library's license comment to the beginning of the minified file.
task('comments', true, function () {
	return (gulp
		.src(files.min)
		.pipe(raiseComments())
		.pipe(gulp.dest(dir.dist))
	);
});

// Do the tests last so we're testing against the actual built, minified file.
// Individual tests can be changed to use the debug file in dist if tests fail.
task('test', true, function () {
	return (gulp
		.src(files.test)
		.pipe(mocha({
			reporter: 'nyan',
		}))
	);
});

// Run the tasks in series, in the order they were defined. 
task('build', false, function (callback) {
	runSequence(...buildQueue, callback);
});

// On 'src' changes, re-run the 'build' task.
// On 'test' changes, re-run just the 'test' task.
task('watch', false, function () {
	watch(files.src, tasks.build);
	watch(files.test, function (callback) {
		// Do it through runSequence so it runs as a task, for nice output.
		runSequence('test', callback);
	});
});

// Make `gulp` run the build task.
task('default', false, tasks.build);
