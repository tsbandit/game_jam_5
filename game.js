(function() {

const game = modules.define('game')
.import('util')
.export(function (defs) {
	const WIDTH  = 640;
	const HEIGHT = 480;
	
	let ui = {};
	
	function PartyMember(name, hp, power, speed) {
		this.name = name;
		this.maxhp = hp;
		this.curhp = hp;
		this.power = power;
		this.speed = speed;
	}
	const party = [];
	party.push(new PartyMember("Bobette", 10, 5, 1.0));
	party.push(new PartyMember("Muscle Sorceress", 8, 5, 1.3));
	party.push(new PartyMember("Carl", 9, 5, 1.4));
	party.push(new PartyMember("Dave", 11, 5, 1.4));
	
	// Game
	var exports = {
		WIDTH,
		HEIGHT,
		ui,
		party,
		
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