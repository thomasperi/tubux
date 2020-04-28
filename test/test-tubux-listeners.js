const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Listeners Test', () => {
	
		it('listen direct', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.listen(function (value) {
							external = value;
						})
				}
			});

			var p = new Person();
			assert.equal(external, 'John');
			
			p.name('Jane');
			assert.equal(external, 'Jane');
		});


		it('listen readonly direct', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
						.listen(function (value) {
							external = value;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.claim()
					});
				}
			});

			var p = new Person();
			assert.equal(external, 'John');
			
			p.name_inner('Jane');
			assert.equal(external, 'Jane');
		});


		it('listen writeonly direct', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
						.listen(function (value) {
							external = value;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.claim()
					});
				}
			});

			var p = new Person();
			assert.equal(external, 'John');
			
			p.name_inner('Jane');
			assert.equal(external, 'Jane');
		});
		
		it('listen in constructor', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John').accessor()
				},
				construct: function () {
					this.name
						.listen(function (value) {
							external = value;
						})
						.publish();
				}
			});

			var p = new Person();
			assert.equal(external, 'John');
			
			p.name('Jane');
			assert.equal(external, 'Jane');
		});

		it('listen readonly in constructor', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
				},
				construct: function () {
					var name = this.name.claim();
					
					name.listen(function (value) {
						external = value;
					}).publish();
					
					$$.assign(this, {
						name_inner: name
					});
				}
			});

			var p = new Person();
			assert.equal(external, 'John');
			
			p.name_inner('Jane');
			assert.equal(external, 'Jane');
		});


		it('listen writeonly in constructor', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.writeonly()
				},
				construct: function () {
					var name = this.name.claim();
					
					name.listen(function (value) {
						external = value;
					}).publish();
				}
			});

			var p = new Person();
			assert.equal(external, 'John');
			
			p.name('Jane');
			assert.equal(external, 'Jane');
		});

		it('listen outside', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John').accessor()
				}
			});

			var p = new Person();
			p.name.listen(function (value) {
				external = value;
			});
			p.name('Earl');
			assert.equal(external, 'Earl');
		});

		it('listen readonly outside', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.readonly()
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.claim()
					});
				}
			});

			var p = new Person();
			p.name.listen(function (value) {
				external = value;
			});
			p.name_inner('Earl');
			assert.equal(external, 'Earl');
		});


		it('listen writeonly outside should fail', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.writeonly()
				}
			});

			var p = new Person();
			try {
				p.name.listen(function (value) {
					external = value;
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.WRITEONLY);
				assert.equal(e.key, 'name');
			}

			p.name('Earl');
			assert.notEqual(external, 'Earl');
		});

		it('multiple listeners on proxy', function () {
	
			var a, b, c;

			var Person = $$.struct({
				params: {
					name: $$('John Doe')
						.accessor()
						.listen(function (val) {
							a = val;
						})
						.listen(function (val) {
							b = val;
						})
						.listen(function (val) {
							c = val;
						})
				}
			});

			var p = new Person();
		
			p.name('Jane Doe');

			assert.equal(a, 'Jane Doe');
			assert.equal(b, 'Jane Doe');
			assert.equal(c, 'Jane Doe');

		});

		it('multiple listeners after instance', function () {
	
			var a, b, c;

			var Person = $$.struct({
				params: {
					name: $$('John Doe').accessor()
				}
			});

			var p = new Person();
			(p.name
				.listen(function (val) {
					a = val;
				})
				.listen(function (val) {
					b = val;
				})
				.listen(function (val) {
					c = val;
				})
			);
		
			p.name('Jane Doe');

			assert.equal(a, 'Jane Doe');
			assert.equal(b, 'Jane Doe');
			assert.equal(c, 'Jane Doe');

		});

		it('multiple listeners both places', function () {
	
			var a, b, c, d, e, f;

			var Person = $$.struct({
				params: {
					name: $$('John Doe')
						.accessor()
						.listen(function (val) {
							a = val;
						})
						.listen(function (val) {
							b = val;
						})
						.listen(function (val) {
							c = val;
						})
				}
			});

			var p = new Person();
			(p.name
				.listen(function (val) {
					d = val;
				})
				.listen(function (val) {
					e = val;
				})
				.listen(function (val) {
					f = val;
				})
			);
		
			p.name('Jane Doe');

			assert.equal(a, 'Jane Doe');
			assert.equal(b, 'Jane Doe');
			assert.equal(c, 'Jane Doe');
			assert.equal(d, 'Jane Doe');
			assert.equal(e, 'Jane Doe');
			assert.equal(f, 'Jane Doe');

		});

		it('multiple listeners with multiple filters', function () {
		
			var a, b, c;

			var Person = $$.struct({
				params: {
					name: $$('John Doe').accessor()
				}
			});

			var p = new Person();
			(p.name
				.listen(function (val) {
					a = val;
				})
				.filter(function (val) {
					return String(val).replace('o', 'O');
				})
				.listen(function (val) {
					b = val;
				})
				.listen(function (val) {
					c = val;
				})
				.filter(function (val) {
					return String(val).replace('n', 'N');
				})
				.filter(function (val) {
					return String(val).replace('J', 'j');
				})
			);
			
			assert.equal(a, 'jOhN Doe');
			assert.equal(b, 'jOhN Doe');
			assert.equal(c, 'jOhN Doe');

			p.name('Jane Doe');

			assert.equal(a, 'jaNe DOe');
			assert.equal(b, 'jaNe DOe');
			assert.equal(c, 'jaNe DOe');

		});

	});

});