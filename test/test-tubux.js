// Run tests on the debug and min files.
module.exports = function (fn) {
	fn(require('../dist/tubux.debug.js'));
	fn(require('../dist/tubux.min.js'));
};