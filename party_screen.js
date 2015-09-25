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

	const trash = {x: game.WIDTH/2, y: game.HEIGHT-30, w: game.WIDTH/2, h:30};

    const exports = {};
	exports.initUi = function(prev_ui) {
		let selected = null;
		let selected_offset_x;
		let selected_offset_y;

		const draw_draggable = function(ctx, draggable) {
			let {equip, x, y, w, h} = draggable;
			if(selected !== null  &&  draggable.equip === selected.equip) {
				x = input.mx + selected_offset_x;
				y = input.my + selected_offset_y;
			}

			ctx.fillStyle = '#83f';
			ctx.fillRect(x, y, w, h);
			ctx.fillStyle = 'white';
			ctx.fillText(equip.name, x+5, y+19);
		};

		const PER_PLAYER = 100;

		const generate_draggables = function() {
			const result = [];

			for(let i=0; i<battle.player_data.equipment.length; ++i) {
				const n = i;
				const equip = battle.player_data.equipment[i];
				result.push({
					equip,
					x: game.WIDTH/2 + 32,
					y: 35+24*i,
					w: 160,
					h: 23,
					remove() {
						battle.player_data.equipment.splice(n, 1);
					},
				});
			}
			for(let i=0; i<battle.allies.length; ++i) {
				const a = battle.allies[i];
				for(let j=0; j<a.equipment.length; ++j) {
					const n = j;
					result.push({
						equip: a.equipment[j],
						x: 32,
						y: 35+i*PER_PLAYER+j*24,
						w: 160,
						h: 23,
						remove() {
							a.equipment.splice(n, 1);
						},
					});
				}
			}

			return result;
		};

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

				ctx.fillText('EQUIPMENT', game.WIDTH/2, 30);
				for(let i=0; i<battle.allies.length; ++i) {
					const a = battle.allies[i];
					ctx.fillText(a.name, 0, 30+PER_PLAYER*i);
				}

				ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
				ctx.fillRect(trash.x, trash.y, trash.w, trash.h);
				ctx.fillStyle = 'black';
				ctx.fillText('Click and drag items.',
				             game.WIDTH/2, game.HEIGHT - 30);
				ctx.fillText('(Drag HERE to discard.)',
				             game.WIDTH/2, game.HEIGHT - 6);

				const draggables = generate_draggables();
				for(let d of draggables)
					draw_draggable(ctx, d);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function({mx, my}) {
				if(over_button(exit_button))
					return game.ui = prev_ui;

				// Disallow dragging things hidden under the trash
				if(over_button(trash))
					return;

				const draggables = generate_draggables();
				for(let d of draggables)
					if(over_button(d)) {
						selected = d;
						selected_offset_x = d.x - mx;
						selected_offset_y = d.y - my;
						break;
					}
			},
			mouse_released({mx, my}) {
				if(selected === null)
					return;

				if(mx > game.WIDTH/2) {
					if(over_button(trash)) {
						selected.remove();
					} else {
						selected.remove();
						battle.player_data.equipment.push(selected.equip);
					}
				} else {
					for(let i=0; i<battle.allies.length; ++i) {
						if(my < (i+1)*PER_PLAYER) {
							selected.remove();
							battle.allies[i].equipment.push(selected.equip);
							break;
						}
					}
				}

				selected = null;
			},
		};

		return ui;
	};
	
	return exports;
});

}());
