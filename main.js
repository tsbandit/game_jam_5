// Initialize the 'ui' object.
modules.define('main')
.import('input')
.import('game')
.import('util')
.import('title')
.import('image')
.import('battle')
.export(function (defs) {
	
defs.util.run_async(function*(resume) {
////////////////////////////////////////////////////////////////////////
// MAIN THREAD
	
	const game = defs.game;
	
	// Wait until the window 'load' event
	window.addEventListener('load', resume);
	yield;
	
	// Create canvas
	const canvas = document.createElement('canvas');
	canvas.setAttribute('width',  game.WIDTH);
	canvas.setAttribute('height', game.HEIGHT);
	document.body.appendChild(canvas);
	game.canvas = canvas;

	// Initialize input
	defs.input.init();
	
	// Install animation-frame handler
	{
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
	}

	game.loadImages(function () {
		game.ui = defs.title.initUi();
	});
// END OF MAIN THREAD
////////////////////////////////////////////////////////////////////////

});

});