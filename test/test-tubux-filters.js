const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Filter Test', () => {

		it('filter direct', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.filter(function (val) {
							return typeof val === 'string' ?
								val.toUpperCase() :
								'' + val;
						})
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name(), 'JOHN');
			
			// Public setter gets filtered
			p.name('Jane');
			assert.equal(p.name(), 'JANE');
		});

		it('filter readonly direct', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
						.filter(function (val) {
							return typeof val === 'string' ?
								val.toUpperCase() :
								'' + val;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.claim()
					});
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name(), 'JOHN');
			
			// secretate setter gets filtered
			p.name_inner('Jane');
			assert.equal(p.name(), 'JANE');
		});

		it('filter writeonly direct', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.writeonly()
						.filter(function (val) {
							return typeof val === 'string' ?
								val.toUpperCase() :
								'' + val;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.claim()
					});
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name_inner(), 'JOHN');
			
			// Public setter gets filtered
			p.name('Jane');
			assert.equal(p.name_inner(), 'JANE');
		});

		it('filter in constructor', function () {
			var Person = $$.struct({
				params: {
					name: $$('John').accessor()
				},
				construct: function () {
					this.name
						.filter(function (val) {
							return typeof val === 'string' ?
								val.toUpperCase() :
								'' + val;
						});
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name(), 'JOHN');
			
			// Public setter gets filtered
			p.name('Jane');
			assert.equal(p.name(), 'JANE');
		});

		it('filter readonly in constructor', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
				},
				construct: function () {
					var name = this.name.claim();
					
					name.filter(function (val) {
						return typeof val === 'string' ?
							val.toUpperCase() :
							'' + val;
					});
					
					$$.assign(this, {
						name_inner: name
					});
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name(), 'JOHN');
			
			// Public setter gets filtered
			p.name_inner('Jane');
			assert.equal(p.name(), 'JANE');
		});

		it('filter writeonly in constructor', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.writeonly()
				},
				construct: function () {
					var name = this.name.claim();
					
					name.filter(function (val) {
						return typeof val === 'string' ?
							val.toUpperCase() :
							'' + val;
					});
					
					$$.assign(this, {
						name_inner: name
					});
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name_inner(), 'JOHN');
			
			// Public setter gets filtered
			p.name('Jane');
			assert.equal(p.name_inner(), 'JANE');
		});

		it('filter outside', function () {
			var Person = $$.struct({
				params: {
					name: $$('John').accessor()
				}
			});

			// Existing gets filtered
			var p = new Person();
			p.name.filter(function (val) {
				return typeof val === 'string' ?
					val.toUpperCase() :
					'' + val;
			});
			assert.equal(p.name(), 'JOHN');
			
			// Public setter gets filtered
			p.name('Jane');
			assert.equal(p.name(), 'JANE');
		});

		it('filter readonly outside should fail', function () {

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
				}
			});

			var p = new Person();
			try {
				p.name.filter(function (val) {
					return typeof val === 'string' ?
						val.toUpperCase() :
						'' + val;
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.READONLY);
				assert.equal(e.key, 'name');
			}
		});

		it('filter writeonly outside should fail', function () {

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.writeonly()
				}
			});

			var p = new Person();
			try {
				p.name.filter(function (val) {
					return typeof val === 'string' ?
						val.toUpperCase() :
						'' + val;
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.WRITEONLY);
				assert.equal(e.key, 'name');
			}
		});

		it('multiple filters on proxy', function () {

			var Person = $$.struct({
				params: {
					name: $$('John Doe')
						.accessor()
						.filter(function (val) {
							return String(val).replace('o', 'O');
						})
						.filter(function (val) {
							return String(val).replace('n', 'N');
						})
						.filter(function (val) {
							return String(val).replace('J', 'j');
						})
				}
			});
			
			var p = new Person();

			assert.equal(p.name(), 'jOhN Doe');
			
			p.name('Jane Doe');

			assert.equal(p.name(), 'jaNe DOe');
		});

		it('multiple filters after instance', function () {

			var Person = $$.struct({
				params: {
					name: $$('John Doe').accessor()
				}
			});

			var p = new Person();
			(p.name
				.filter(function (val) {
					return String(val).replace('o', 'O');
				})
				.filter(function (val) {
					return String(val).replace('n', 'N');
				})
				.filter(function (val) {
					return String(val).replace('J', 'j');
				})
			);
			
			assert.equal(p.name(), 'jOhN Doe');
			
			p.name('Jane Doe');

			assert.equal(p.name(), 'jaNe DOe');

		});

		it('multiple filters both places', function () {

			var Person = $$.struct({
				params: {
					name: $$('the quick brown fox jumps over the lazy dog')
						.accessor()
						.filter(function (val) {
							return String(val).replace('t', 'T');
						})
						.filter(function (val) {
							return String(val).replace('q', 'Q');
						})
						.filter(function (val) {
							return String(val).replace('b', 'B');
						})
				}
			});

			var p = new Person();
			(p.name
				.filter(function (val) {
					return String(val).replace('f', 'F');
				})
				.filter(function (val) {
					return String(val).replace('j', 'J');
				})
				.filter(function (val) {
					return String(val).replace('o', 'O');
				})
			);
			
			assert.equal(p.name(), 'The Quick BrOwn Fox Jumps over the lazy dog');

			p.name('the five boxing wizards jump quickly');

			assert.equal(p.name(), 'The Five BOxing wizards Jump Quickly');

		});

		it('this in filters', function () {

			var Person = $$.struct({
				params: {
					name: $$('John Doe')
						.accessor()
						.filter(function (val) {
							return this.prefix + val;
						}),
					prefix: 'My name is '
				}
			});

			var p = new Person();
			
			assert.equal(p.name(), 'My name is John Doe');
			
			p.name.filter(function (val) {
				return val + ' most certainly';
			});

			assert.equal(p.name(), 'My name is John Doe most certainly');
			
			p.name('Jane Doe');

			assert.equal(p.name(), 'My name is Jane Doe most certainly');

		});

	});

});
