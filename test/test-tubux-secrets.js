const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Secrets test', () => {

		it('secret params object, all params flat', function () {
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
						value: function () {
							return count;
						}
					});
				}
			});
			
			var c1 = new Counter({
				start: 10,
				step: 2
			});
			assert(!c1.hasOwnProperty('start'));
			assert(!c1.hasOwnProperty('step'));
			assert.equal(c1.value(), 10);
			c1.inc(); // by the 2 passed to the c1 instance
			assert.equal(c1.value(), 12);

			var c2 = new Counter();
			assert(!c2.hasOwnProperty('start'));
			assert(!c2.hasOwnProperty('step'));
			assert.equal(c2.value(), 0);
			c2.inc(); // by the default 1
			c2.inc(); // by the default 1
			assert.equal(c2.value(), 2);
			
			c1.inc();
			c1.inc();
			c1.inc();
			assert.equal(c1.value(), 18);
			
		});

		it('secret params object, accessor param', function () {
			var Counter = $$.struct({
				params: $$.secret({
					count: $$(0).accessor(),
					step: 1
				}),
				construct: function (secrets) {
					var count = secrets.count,
						step = secrets.step;
					$$.assign(this, {
						inc: function () {
							count(count() + step);
						},
						value: function () {
							return count();
						}
					});
				}
			});
			
			var c1 = new Counter({
				count: 10,
				step: 2
			});
			assert(!c1.hasOwnProperty('count'));
			assert(!c1.hasOwnProperty('step'));
			assert.equal(c1.value(), 10);
			c1.inc(); // by the 2 passed to the c1 instance
			assert.equal(c1.value(), 12);

			var c2 = new Counter();
			assert(!c2.hasOwnProperty('count'));
			assert(!c2.hasOwnProperty('step'));
			assert.equal(c2.value(), 0);
			c2.inc(); // by the default 1
			c2.inc(); // by the default 1
			assert.equal(c2.value(), 2);
			
			c1.inc();
			c1.inc();
			c1.inc();
			assert.equal(c1.value(), 18);
			
		});

		it('secret individual params, all members flat', function () {
			var Counter = $$.struct({
				params: {
					start: $$(0).secret(),
					step: 1
				},
				construct: function (secrets) {
					var count = secrets.start;
					$$.assign(this, {
						inc: function () {
							count += this.step;
						},
						value: function () {
							return count;
						}
					});
				}
			});
			
			var c1 = new Counter({
				start: 10,
				step: 2
			});
			assert(!c1.hasOwnProperty('start'));
			assert(c1.hasOwnProperty('step'));
			assert.equal(c1.value(), 10);
			c1.inc(); // by the 2 passed to the c1 instance
			assert.equal(c1.value(), 12);

			var c2 = new Counter();
			assert(!c2.hasOwnProperty('start'));
			assert(c2.hasOwnProperty('step'));
			assert.equal(c2.value(), 0);
			c2.inc(); // by the default 1
			c2.inc(); // by the default 1
			assert.equal(c2.value(), 2);
			
			c1.step = 3;
			c1.inc();
			assert.equal(c1.value(), 15);
			
		});

		it('secret individual accessor', function () {
			var Counter = $$.struct({
				params: {
					count: $$(0).accessor().secret(),
					step: $$(1)
				},
				construct: function (secrets) {
					var count = secrets.count.claim();
					$$.assign(this, {
						inc: function () {
							count(count() + this.step);
						},
						value: function () {
							return count();
						}
					});
				}
			});
			
			var c1 = new Counter({
				count: 10,
				step: 2
			});
			assert(!c1.hasOwnProperty('count'));
			assert(c1.hasOwnProperty('step'));
			assert.equal(c1.value(), 10);
			c1.inc(); // by the 2 passed to the c1 instance
			assert.equal(c1.value(), 12);

			var c2 = new Counter();
			assert(!c2.hasOwnProperty('count'));
			assert(c2.hasOwnProperty('step'));
			assert.equal(c2.value(), 0);
			c2.inc(); // by the default 1
			c2.inc(); // by the default 1
			assert.equal(c2.value(), 2);
			
			c1.step = 3;
			c1.inc();
			assert.equal(c1.value(), 15);
			
		});
	
	});

});