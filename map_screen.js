(function() {
   
const map_screen = modules.define('map_screen')
.import('game')
.import('image')
.import('battle')
.export(function (defs) {
    
    const exports = {};
	const {game,image,battle} = defs;
	exports.initUi = function () {
		const draw_disc = function(ctx, x, y, r, c) {
			ctx.fillStyle = c;

			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI*2);
			ctx.fill();
		};

		const BASE_X = 50;
		const BASE_Y = 50;
		const ROOM_W = 32;
		const ROOM_H = 32;

		let px = 0;
		let py = 0;

		const make_room = function(x, y) {
			const mob = (Math.random() < 0.3);
			return {mob:mob, x:x, y:y, visible:false};
		};

		const grid = [];
		for(let i=0; i<4; ++i) {
			grid.push([]);
			for(let j=0; j<5; ++j)
				grid[i].push(make_room(j, i));
		}

		grid[0][0].visible = true;
		grid[1][0].visible = true;
		grid[0][1].visible = true;

		const draw_room = function(ctx, x, y) {
			const room = grid[y][x];

			if(!room.visible)
				return;

			const sx = BASE_X+ROOM_W*x;
			const sy = BASE_Y+ROOM_H*y;

			image.drawImage(ctx, 'Game Jam Rooms/Solid Room.png', sx, sy);

			if(room.mob)
				draw_disc(ctx, sx+ROOM_W/4, sy+ROOM_H/4, 8, 'red');
		};

		const ui = {
			draw: function (ctx) {
				for(let i=0; i<grid.length; ++i)
					for(let j=0; j<grid[i].length; ++j)
						draw_room(ctx, j, i);

				// Draw player
				draw_disc(ctx, BASE_X+(px+.5)*ROOM_W, BASE_Y+(py+.5)*ROOM_H, 12, 'black');
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function({mx,my}) {
				const rx = Math.floor((mx-BASE_X)/ROOM_W);
				const ry = Math.floor((my-BASE_Y)/ROOM_H);
				if(ry >= 0  &&  ry < grid.length  &&  rx >= 0  &&  rx < grid[ry].length) {
					px = rx;
					py = ry;

					if(grid[ry][rx].mob)
						return game.ui = battle.initUi(ui);
				}
			},
		};

		return ui;
	};
	
	return exports;
});

}());
