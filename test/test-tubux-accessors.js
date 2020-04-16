const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Accessors Test', () => {
		
		it('required proxy without accessor with ignored default', function () {
			var Person = $$.struct({
				params: {
					name: $$('John').required()
				}
			});
			var p = new Person({
				name: 'John'
			});
			assert.equal(p.name, 'John');
			
			try {
				var p = new Person();
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.REQUIRED);
				assert.equal(e.key, 'name');
			}
		});

		it('required proxy without accessor without default', function () {
			var Person = $$.struct({
				params: {
					name: $$().required()
				}
			});
			var p = new Person({
				name: 'John'
			});
			assert.equal(p.name, 'John');
			
			try {
				var p = new Person();
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.REQUIRED);
				assert.equal(e.key, 'name');
			}
		});

		it('required proxy with accessor with ignored default', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.required()
				}
			});
			var p = new Person({
				name: 'John'
			});
			assert.equal(p.name(), 'John');
			
			try {
				var p = new Person();
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.REQUIRED);
				assert.equal(e.key, 'name');
			}
		});

		it('required proxy with accessor without default', function () {
			var Person = $$.struct({
				params: {
					name: $$()
						.accessor()
						.required()
				}
			});
			var p = new Person({
				name: 'John'
			});
			assert.equal(p.name(), 'John');
			
			try {
				var p = new Person();
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.REQUIRED);
				assert.equal(e.key, 'name');
			}
		});
		
		it('accessor-only flags', function () {
			try {
				var Person = $$.struct({
					params: {
						name: $$('John').readonly()
					}
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.ACCESSORONLY);
				assert.equal(e.key, 'readonly');
			}

			try {
				var Person = $$.struct({
					params: {
						name: $$('John').writeonly()
					}
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.ACCESSORONLY);
				assert.equal(e.key, 'writeonly');
			}

			try {
				var Person = $$.struct({
					params: {
						name: $$('John').listen(function (val) {
							return val;
						})
					}
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.ACCESSORONLY);
				assert.equal(e.key, 'listen');
			}
		});

		it('read-write', function () {
			var Person = $$.struct({
				params: {
					name: $$('John').accessor()
				},
				construct: function () {
					this.name_inner = this.name.secret();
				}
			});
			var p = new Person();
			assert.equal(p.name(), 'John')
			
			p.name('Jane');
			assert.equal(p.name(), 'Jane')

			p.name_inner('Jake');
			assert.equal(p.name_inner(), 'Jake')
		});
		
		it('readonly', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
				},
				construct: function () {
					this.name_inner = this.name.secret();
				}
			});
			
			// Public getter should succeed
			var p = new Person();
			assert.equal(p.name(), 'John');
			// Public setter should fail
			try {
				p.name('Jake');
				assert(false, 'bad success');
			} catch(e) {
				assert.equal(e.message, $$.errors.READONLY);
				assert.equal(e.key, 'name');
			}
			assert.equal(p.name(), 'John')

			// secretate setter should succeed
			p.name_inner('Jane');
			assert.equal(p.name(), 'Jane')

			// secretate getter should succeed
			assert.equal(p.name_inner(), 'Jane')
		});

		it('writeonly', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.writeonly()
				},
				construct: function () {
					this.name_inner = this.name.secret();
				}
			});
			
			// Public getter should fail
			var p = new Person();
			try {
				p.name();
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.WRITEONLY);
				assert.equal(e.key, 'name');
			}
			
			// secretate getter should succeed
			assert.equal(p.name_inner(), 'John');
			
			// Public setter should succeed
			p.name('Jake');
			assert.equal(p.name_inner(), 'Jake');
			
			// secretate setter should succeed
			p.name_inner('Jane');
			assert.equal(p.name_inner(), 'Jane');
			
		});

	});

});
