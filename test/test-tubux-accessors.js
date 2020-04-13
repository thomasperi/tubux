const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Accessors Test', () => {
		
		it('read-write', function () {
			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
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
					name: $$.accessor('John').readonly()
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
				assert.equal(e, $$.errors.READONLY);
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
					name: $$.accessor('John').writeonly()
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
				assert.equal(e, $$.errors.WRITEONLY);
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
					name: $$.accessor('John').hidden()
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
				assert.equal(e, $$.errors.HIDDEN);
			}
			
			// Public getter should fail
			var p = new Person();
			try {
				p.name();
				assert(false);
			} catch(e) {
				assert.equal(e, $$.errors.HIDDEN);
			}

			// Private getter should succeed
			assert.equal(p.name_inner(), 'John');

			// Private setter should succeed
			p.name_inner('Jane');
			assert.equal(p.name_inner(), 'Jane');
		});
		
	});

});
