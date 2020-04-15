const assert = require('assert');
require('./test-tubux.js')(function ($$) {

	describe('Temporary tests for experimental features', () => {

		it('secret whole params object', function () {
			console.log('secrets test...');
			var Counter = $$.struct({
				params: $$.secret({
					count: $$(0).required()
				}),
				construct: function (secrets) {
					console.log('secrets construct...');
					console.log(secrets);
				}
			});
			
			var c = new Counter({
				count: 5
			});
		});

		it('secret individual params', function () {
			
		});
	
	});

});