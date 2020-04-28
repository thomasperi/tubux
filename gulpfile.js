// These need to be loaded in this gulpfile for some reason.
var gulp = require('gulp');
var runSequence = require('gulp4-run-sequence');

// Pre-create the tasks to define, using the parameters
var tasks = require('@thomasperi/my-gulp-tasks')({
	// Send the required things to where they'll actually be used...
	'gulp': gulp,
	'runSequence': runSequence,

	// For the examples index title
	'pretty_name': 'Tubux',
	
	// The JavaScript variable the library is to be exported as
	'export_var': "$$",

	// For gulp-umd
	'dependencies': [],
});

// Actually define them as gulp tasks
for (var name in tasks) {
	gulp.task(name, tasks[name]);
}
