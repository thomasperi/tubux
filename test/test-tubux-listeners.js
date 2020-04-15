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
						name_inner: this.name.secret()
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
						name_inner: this.name.secret()
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
					name: $$('John')
						.accessor()
						.hidden()
						.listen(function (value) {
							external = value;
						})
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.secret()
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
					var name = this.name.secret();
					
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
					var name = this.name.secret();
					
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
					name: $$('John')
						.accessor()
						.hidden()
				},
				construct: function () {
					var name = this.name.secret();
					
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
						name_inner: this.name.secret()
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


		it('listen hidden outside should fail', function () {
			var external;

			var Person = $$.struct({
				params: {
					name: $$('John')
						.accessor()
						.hidden()
				},
				construct: function () {
					$$.assign(this, {
						name_inner: this.name.secret()
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
				assert.equal(e.message, $$.errors.HIDDEN);
				assert.equal(e.key, 'name');
			}

			p.name_inner('Earl');
			assert.notEqual(external, 'Earl');
		});


	});

});