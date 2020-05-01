var $$ = require('../dist/tubux.min.js');

/**
 * Counter
 */
var Counter = $$.struct({
	params: {
		count: $$(0).secret()
	},
	construct: function (secret) {
		var count = secret.count;
			
		$$.assign(this, {
			inc: function () {
				count++;
			},
			count: function () {
				return count;
			}
		});
	},
	proto: {
		toString: function () {
			return `Counter(${this.count()})`;
		}
	},
	statics: {
		combine: function (counter1, counter2) {
			return new Counter({
				count: counter1.count() + counter2.count()
			});
		}
	}
});

var c1 = new Counter({
	count: 10
});
console.log(c1.count()); // 10
c1.inc();
console.log(c1.count()); // 11

var c2 = new Counter();
console.log(c2.count()); // 0
c2.inc();
c2.inc();
c2.inc();
console.log(c2.count()); // 3

var c3 = Counter.combine(c1, c2);
console.log(c3.count()); // 14

console.log(`${c3}`); // Counter(14)
