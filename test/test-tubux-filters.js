const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Filter Test', () => {

		it('filter direct', function () {
			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
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
					name: $$.accessor('John')
						.readonly()
						.filter(function (val) {
							return typeof val === 'string' ?
								val.toUpperCase() :
								'' + val;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
					});
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name(), 'JOHN');
			
			// Private setter gets filtered
			p.name_inner('Jane');
			assert.equal(p.name(), 'JANE');
		});

		it('filter writeonly direct', function () {
			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
						.writeonly()
						.filter(function (val) {
							return typeof val === 'string' ?
								val.toUpperCase() :
								'' + val;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
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

		it('filter hidden direct', function () {
			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
						.hidden()
						.filter(function (val) {
							return typeof val === 'string' ?
								val.toUpperCase() :
								'' + val;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
					});
				}
			});

			// Default gets filtered
			var p = new Person();
			assert.equal(p.name_inner(), 'JOHN');
			
			// Public setter gets filtered
			p.name_inner('Jane');
			assert.equal(p.name_inner(), 'JANE');
		});

		it('filter in constructor', function () {
			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
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
					name: $$.accessor('John').readonly()
				},
				construct: function () {
					var name = this.name.ready();
					
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
					name: $$.accessor('John').writeonly()
				},
				construct: function () {
					var name = this.name.ready();
					
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

		it('filter hidden in constructor', function () {
			var Person = $$.struct({
				params: {
					name: $$.accessor('John').hidden()
				},
				construct: function () {
					var name = this.name.ready();
					
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
			p.name_inner('Jane');
			assert.equal(p.name_inner(), 'JANE');
		});

		it('filter outside', function () {
			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
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
					name: $$.accessor('John').readonly()
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
				assert.equal(e, $$.errors.READONLY);
			}
		});

		it('filter writeonly outside should fail', function () {

			var Person = $$.struct({
				params: {
					name: $$.accessor('John').writeonly()
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
				assert.equal(e, $$.errors.WRITEONLY);
			}
		});

		it('filter hidden outside should fail', function () {

			var Person = $$.struct({
				params: {
					name: $$.accessor('John').hidden()
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
				assert.equal(e, $$.errors.HIDDEN);
			}
		});
		
	});

});
