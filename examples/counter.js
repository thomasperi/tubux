var $$ = require('../dist/tubux.min.js');

/**
 * Counter
 */
var Counter = $$.struct({
	params: $$.secret({
		start: 0,
		step: 1
	}),
	construct: function (secrets) {
		var count = secrets.start,
			step = secrets.step;
		$$.assign(this, {
			inc: function () {
				count += step;
			},
			count: function () {
				return count;
			}
		});
	}
});

console.log('Creating a Counter starting at 10 and stepping 2 at a time.');
var c1 = new Counter({
	start: 10,
	step: 2
});

console.log('Initial value should be 10:');
console.log(c1.count());

console.log('Incrementing should increase by 2:');
c1.inc();
console.log(c1.count());

console.log('Creating a second Counter with default start (0) and step (1) values.');
var c2 = new Counter();

console.log('Initial value should be 0:');
console.log(c2.count());

console.log('Incrementing 3 times should increase by 3:');
c2.inc();
c2.inc();
c2.inc();
console.log(c2.count());

