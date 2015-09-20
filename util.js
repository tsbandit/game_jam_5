(function() {

const util = modules.define('util', {
	assert(b) {
		if(b)
			return;

		debugger;
		throw 'assertion failure';
	},
	
	barrier(spawner, cb) {
		let n_expected = 0;
		let n_done = 0;
		const results = [];
		spawner(function() {
			const n = n_expected;
			++n_expected;
			return function(r) {
				++n_done;
				results[n] = r;

				assert(n_done <= n_expected);
				if(n_done === n_expected)
					cb(results);
			};
		});
	},
	
	// This function kind of spawns a new thread. Kind of.
	// It should be called NEAR THE END of the current turn of the event loop.
	run_async(gen_fn) {
		const gen = gen_fn(x => gen.next(x).value);
		gen.next();
	},
		
	// Utility function:  dispatch
	// Usage:
	//   obj = {type: 'TypeA', fieldA: 'foo'};
	//   dispatch(obj, {
	//     TypeA:   ({fieldA}) => {...},
	//     TypeB:   ({fieldB}) => {...},
	//     DEFAULT: event      => {...},
	//   });
	dispatch(discriminee, cases) {
		const f = cases[discriminee.type];
		if(f === undefined) {
			const g = cases.DEFAULT;
			if(g === undefined)
				return undefined;
			else if(typeof(g) === 'function')
				return g(discriminee);
			else
				return dispatch(discriminee, g);
		} else {
			return f(discriminee);
		}
	}
});

}());
