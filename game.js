(function() {

const game = modules.define('game')
.import('util')
.export(function (defs) {
	const WIDTH  = 640;
	const HEIGHT = 480;
	
	let ui = {};
	
	// Game
	var exports = {
		WIDTH,
		HEIGHT,
		ui,
		
		canvas: null,
		
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
		},
		
		initCanvas() {
			// Create canvas
			const canvas = document.createElement('canvas');
			canvas.setAttribute('width',  game.WIDTH);
			canvas.setAttribute('height', game.HEIGHT);
			document.body.appendChild(canvas);
			game.canvas = canvas;
			
			// Install animation-frame handler
			const ctx = canvas.getContext('2d');
			ctx.fillStyle = 'red';

			let prev_timestamp = null;
			const anim = function(timestamp) {
				if(prev_timestamp === null)
					prev_timestamp = timestamp - 16;

				(game.ui.tick || (() => {})) (timestamp - prev_timestamp);

				ctx.clearRect(0, 0, game.WIDTH, game.HEIGHT);
				(game.ui.draw || (() => {})) (ctx);

				prev_timestamp = timestamp;
				requestAnimationFrame(anim);
			};
			requestAnimationFrame(anim);
	
			return canvas;
		}
	};
	
	return exports;
});

}());