(function() {

const game = modules.define('game')
.import('util')
.export(function (defs) {
	const WIDTH  = 640;
	const HEIGHT = 480;
	
	let ui = {};
	
	// Input
	var exports = {
		WIDTH,
		HEIGHT,
		ui,
		
		delimit(new_ui, gen_func) {
			defs.util.run_async(function*(resume) {
				const old_ui = ui;
				ui = new_ui;
				try {
					yield* gen_func(resume);
				} finally {
					ui = old_ui;
				}
			});
		}
	};
	
	return exports;
});

}());