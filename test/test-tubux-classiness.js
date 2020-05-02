const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Classiness Test', () => {

		var Person = $$.struct({
			params: {
				first: 'John',
				last: 'Doe'
			},
			proto: {
				toString: function () {
					return this.first + ' ' + this.last;
				}
			},
			statics: {
				meet: function (p1, p2) {
					return p1 + ' meets ' + p2;
				}
			},
			construct: function () {
				var hitpoints = 5;
				this.hit = function () {
					return --hitpoints;
				};
			}
		});
	
		it('plain', function () {
			var p = Person();
			assert(!(p instanceof Person));
			assert(p.hasOwnProperty('toString'));
		});

		it('instance', function () {
			var p = new Person();
			assert(p instanceof Person);
			assert(!p.hasOwnProperty('toString'));
		});

		it('default params (instance)', function () {
			var p = new Person();
			assert.equal(p.first, 'John');
			assert.equal(p.last, 'Doe');
		});

		it('default params (plain)', function () {
			var p = Person();
			assert.equal(p.first, 'John');
			assert.equal(p.last, 'Doe');
		});

		it('override one default (instance)', function () {
			var p = new Person({
				first: 'Jane'
			});
			assert.equal(p.first, 'Jane');
			assert.equal(p.last, 'Doe');
		});

		it('override one default (plain)', function () {
			var p = Person({
				first: 'Jane'
			});
			assert.equal(p.first, 'Jane');
			assert.equal(p.last, 'Doe');
		});

		it('override both defaults (instance)', function () {
			var p = new Person({
				first: 'Ada',
				last: 'Lovelace'
			});
			assert.equal(p.first, 'Ada');
			assert.equal(p.last, 'Lovelace');
		});

		it('override both defaults (plain)', function () {
			var p = Person({
				first: 'Ada',
				last: 'Lovelace'
			});
			assert.equal(p.first, 'Ada');
			assert.equal(p.last, 'Lovelace');
		});

		it('toString (instance)', function () {
			var p = new Person();
			assert.equal(String(p), 'John Doe');
		});

		it('toString (plain)', function () {
			var p = Person();
			assert.equal(String(p), 'John Doe');
		});

		it('toString after params (instance)', function () {
			var p = new Person({
				first: 'Ada',
				last: 'Lovelace'
			});
			assert.equal(String(p), 'Ada Lovelace');
		});

		it('toString after params (plain)', function () {
			var p = Person({
				first: 'Ada',
				last: 'Lovelace'
			});
			assert.equal(String(p), 'Ada Lovelace');
		});

		it('prototype toString after manual assignment', function () {
			var p = new Person({
				first: 'Jane'
			});
			p.first = 'Margaret';
			p.last = 'Hamilton';
			assert.equal(String(p), 'Margaret Hamilton');
		});
		
		it('static meet', function () {
			var jane = new Person({
					first: 'Jane'
				}),
				jack = new Person({
					first: 'Jack',
					last: 'Olantern'
				});
			
			assert.equal(
				Person.meet(jane, jack),
				'Jane Doe meets Jack Olantern'
			);
		});

		it('contructor private hitpoints', function () {
			var p = new Person();
			assert.equal(p.hit(), 4);
			assert.equal(p.hit(), 3);
			assert.equal(p.hit(), 2);
		});
		
	});

});