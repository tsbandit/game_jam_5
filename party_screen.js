(function() {
   
const party_screen = modules.define('party_screen')
.import('game')
.import('image')
.import('battle')
.import('util')
.import('input')
.export(function (defs) {
	const {image, game, battle, util, input} = defs;

	const over = function(x, y, w, h) {
		const {mx, my} = input;
		return  mx >= x  &&  mx < x+w  &&  my >= y  &&  my < y+h;
	};
	const draw_button = function(ctx, {x, y, w, h, color, text}) {
		if(over(x, y, w, h))
			ctx.fillStyle = color.bright;
		else
			ctx.fillStyle = color.dark;
		ctx.fillRect(x, y, w, h);
		ctx.font = 'bold 19px sans-serif';
		ctx.fillStyle = 'white';
		ctx.textAlign = 'left';
		ctx.fillText(text, x+.2*h, y+.8*h);
	};
	const over_button = function({x, y, w, h}) {
		return over(x, y, w, h);
	};

    const exports = {};
	exports.initUi = function(prev_ui) {
		const exit_button = {
			x: 20,
			y: game.HEIGHT - 20 - 24,
			w: 200,
			h: 24,
			color: {
				bright: 'blue',
				dark:   '#44f',
			},
			text: 'Return to game',
		};

		const ui = {
			draw: function (ctx) {
				util.assert(battle.allies.length === 4);

				draw_button(ctx, exit_button);

				ctx.font = '19px sans-serif';
				ctx.fillStyle = 'black';
				ctx.textAlign = 'left';

				ctx.fillText('EQUIPMENT', game.WIDTH/2, 50);
				for(let i=0; i<battle.allies.length; ++i) {
					const a = battle.allies[i];

					ctx.fillText(a.name, 50, 50+50*i);
				}
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				if(over_button(exit_button))
					return game.ui = prev_ui;
			},
		};

		return ui;
	};
	
	return exports;
});

}());
