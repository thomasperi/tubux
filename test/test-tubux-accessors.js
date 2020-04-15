const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Accessors Test', () => {
		
		it('required proxy without accessor', function () {
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
				var p = new Person()
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.REQUIRED);
				assert.equal(e.key, 'name');
			}
		});

		it('required proxy with accessor', function () {
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
						name: $$('John').hidden()
					}
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.ACCESSORONLY);
				assert.equal(e.key, 'hidden');
			}

			try {
				var Person = $$.struct({
					params: {
						name: $$('John').filter(function (val) {
							return val;
						})
					}
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.ACCESSORONLY);
				assert.equal(e.key, 'filter');
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
					this.name_inner = this.name.ready();
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
					this.name_inner = this.name.ready();
				}
			});
			
			// Public getter should succeed
			var p = new Person();
			assert.equal(p.name(), 'John')
			
			// Public setter should fail
			try {
				p.name('Jake');
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.READONLY);
				assert.equal(e.key, 'name');
			}
			assert.equal(p.name(), 'John')

			// Private setter should succeed
			p.name_inner('Jane');
			assert.equal(p.name(), 'Jane')

			// Private getter should succeed
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
					this.name_inner = this.name.ready();
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
			
			// Private getter should succeed
			assert.equal(p.name_inner(), 'John');
			
			// Public setter should succeed
			p.name('Jake');
			assert.equal(p.name_inner(), 'Jake');
			
			// Private setter should succeed
			p.name_inner('Jane');
			assert.equal(p.name_inner(), 'Jane');
			
		});

		it('hidden', function () {
			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.hidden()
				},
				construct: function () {
					this.name_inner = this.name.ready();
				}
			});
			
			// Public setter should fail
			var p = new Person();
			try {
				p.name('Jane');
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.HIDDEN);
				assert.equal(e.key, 'name');
			}
			
			// Public getter should fail
			var p = new Person();
			try {
				p.name();
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.HIDDEN);
				assert.equal(e.key, 'name');
			}

			// Private getter should succeed
			assert.equal(p.name_inner(), 'John');

			// Private setter should succeed
			p.name_inner('Jane');
			assert.equal(p.name_inner(), 'Jane');
		});
		
	});

});
