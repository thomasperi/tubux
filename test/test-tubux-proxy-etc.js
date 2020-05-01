const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Proxy Tests', () => {
		
		it('no proxies on prototype', function () {
			try {
				var Person = $$.struct({
					proto: {
						proprox: $$(0)
					}
				});
				assert(false);
			} catch(e) {
				assert.equal(e.message, $$.errors.PROTOPROXY);
				assert.equal(e.key, 'proprox');
			}
		});

		it('proxies on static', function () {
			var name = '';
			
			var Person = $$.struct({
				params: {
					name: 'John Doe'
				},
				statics: {
					stat_acc: $$(3.14).accessor()
				},
				proto: {
					greet: function () {
						return 'Hello ' + this.name;
					}
				},
				construct: function () {
					Person.stat_acc.listen(()=> { // arrow for `this`
						name = this.greet();
					});
				}
			});
			
			assert.equal(Person.stat_acc(), 3.14);
			
			var p = new Person();
			Person.stat_acc(2.72);
			
			assert.equal(Person.stat_acc(), 2.72);
			assert.equal(name, 'Hello John Doe');
			
		});

	});

});
