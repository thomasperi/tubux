const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Listeners Test', () => {
	
		it('listen direct', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
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
					name: $$.accessor('John')
						.readonly()
						.listen(function (value) {
							external = value;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
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
					name: $$.accessor('John')
						.readonly()
						.listen(function (value) {
							external = value;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
					});
				}
			});

			var p = new Person();
			assert.equal(external, 'John');
			
			p.name_inner('Jane');
			assert.equal(external, 'Jane');
		});
		

		it('listen hidden direct', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
						.hidden()
						.listen(function (value) {
							external = value;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
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
					name: $$.accessor('John')
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
					name: $$.accessor('John').readonly()
				},
				construct: function () {
					var name = this.name.ready();
					
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
					name: $$.accessor('John').writeonly()
				},
				construct: function () {
					var name = this.name.ready();
					
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


		it('listen hidden in constructor', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$.accessor('John').hidden()
				},
				construct: function () {
					var name = this.name.ready();
					
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


		it('listen outside', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$.accessor('John')
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
					name: $$.accessor('John').readonly()
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
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
					name: $$.accessor('John').writeonly()
				}
			});

			var p = new Person();
			try {
				p.name.listen(function (value) {
					external = value;
				});
				assert(false);
			} catch(e) {
				assert.equal(e, $$.errors.WRITEONLY);
			}

			p.name('Earl');
			assert.notEqual(external, 'Earl');
		});


		it('listen hidden outside should fail', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$.accessor('John').hidden()
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.ready()
					});
				}
			});

			var p = new Person();
			try {
				p.name.listen(function (value) {
					external = value;
				});
				assert(false);
			} catch(e) {
				assert.equal(e, $$.errors.HIDDEN);
			}

			p.name_inner('Earl');
			assert.notEqual(external, 'Earl');
		});


	});

});