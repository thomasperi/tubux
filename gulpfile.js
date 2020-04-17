const gulp = require('gulp');
const runSequence = require('gulp4-run-sequence');
const watch = require('gulp-watch');
const rename = require('gulp-regex-rename')
const fs = require("fs");

const umd = require('gulp-umd');
const pullup = require('@thomasperi/umd-pullup');
const jshint = require('gulp-jshint');

// Yes, use both uglify and minify (terser). Uglify obeys the collapse_vars
// option, and terser mistakenly bases its var collapsing decisions on the
// length of the original variable names instead of the mangled ones.
// So this script uses uglify to mangle, and then minify to optimize the rest,
// once the variable names are short enough not to mess up collapse_vars.
const uglify = require('gulp-uglify');
const minify = require('gulp-minify');

const mocha = require('gulp-mocha');
const raiseComments = require('@thomasperi/raise-comments').gulp;

// Patterns for reading files
var files = {
	src: 'src/*.src.js',
	test: 'test/*.js',
	debug: 'dist/*.debug.js',
	min: 'dist/*.min.js',
	examples: 'examples/*.js'
};

// Directories for writing files
var dir = {
	dist: 'dist',
	examples: 'examples'
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
			'undef': true,
			'unused': true
		}))
		.pipe(jshint.reporter('default'))
	);
});

// Minify the debug file and save the result without the .debug extension.
task('min', true, function () {
	return (gulp
		.src(files.debug)
		.pipe(rename(/\.debug\.js$/, '.min.js'))
		
		// See comments at the top regarding why this uses both uglify and terser.
		.pipe(uglify({
			compress: {
				collapse_vars: false
			},
			output: {
				comments: '/^!/'
			}
		}))
		.pipe(minify({
			'preserveComments': 'some',
			'noSource': true,
			collapse_vars: false,
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

// Lint the example scripts.
task('examples-lint', false, function () {
	return (gulp
		.src(files.examples)
		.pipe(jshint({
			'undef': true,
			'unused': true,
			'globals': {
				'$$': true,
				'console': true,
				'require': true
			}
		}))
		.pipe(jshint.reporter('default'))
	);
});

// Generate the javascript code for setting the list array in _index.html
task('examples-catalog', false, function (callback) {
	// Read the .js files from the examples directory.
	var jsfiles = fs.readdirSync(dir.examples)
		.filter(name => name.slice(-3) === '.js')
		.sort();
	
	// Read the contents of all the files
	var js = {};
	for (var i = 0; i < jsfiles.length; i++) {
		var name = jsfiles[i],
			content = fs.readFileSync(dir.examples + '/' + name, 'utf-8');
		
		// Remove the node require line
		js[name] = content.replace("var $$ = require('../dist/tubux.min.js');", '').trim();
	}
	
	// Write the file to _list.jsonp
	var jsonp = 
		'// This file is auto-generated. Do not edit.\n' +
		'var examples=' + JSON.stringify(js) + ';';
	fs.writeFileSync(dir.examples + '/_list.jsonp', jsonp);
	
	callback();
});

task('examples', false, function (callback) {
	runSequence(
		'examples-lint',
		'examples-catalog',
		callback
	);
});

// Run tasks when changes are detected on certain files.
task('watch', false, function () {
	// On 'src' changes, run the 'build' task.
	watch(files.src, tasks.build);

	// On 'test' changes, run just the 'test' task.
	watch(files.test, function (callback) {
		// Do it through runSequence so it runs as a task, for nice output.
		runSequence('test', callback);
	});
	
	// On 'examples' changes, run the examples task.
	watch(files.examples, tasks.examples);
});

// Make `gulp` run the build task.
task('default', false, tasks.build);
