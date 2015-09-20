(function() {
   
const map_screen = modules.define('map_screen')
.import('game')
.import('battle')
.export(function (defs) {
    
    const exports = {};
	const {game,battle} = defs;
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

		const grid = [];
		for(let i=0; i<4; ++i) {
			grid.push([]);
			for(let j=0; j<5; ++j)
				grid[i].push({});
		}

		const draw_room = function(ctx, x, y) {
			game.drawImage(ctx, 'Game Jam Rooms/Solid Room.png', BASE_X+ROOM_W*x, BASE_Y+ROOM_H*y);
		};

		return {
			draw: function (ctx) {
				// For debugging purposes
				ctx.textAlign = 'left';
				ctx.font = '16px sans-serif';
				ctx.fillText('Click here to enter battle', 0, 30);

				for(let i=0; i<grid.length; ++i)
					for(let j=0; j<grid[i].length; ++j)
						draw_room(ctx, j, i);

				// Draw player
				draw_disc(ctx, BASE_X+(px+.5)*ROOM_W, BASE_Y+(py+.5)*ROOM_H, 12, 'black');
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function({mx,my}) {
				// For debugging purposes
				if(mx < 178 && my < 50)
					return game.ui = battle.initUi();

				if(mx >= BASE_X  &&  my >= BASE_Y) {
					px = Math.floor((mx-BASE_X)/ROOM_W);
					py = Math.floor((my-BASE_Y)/ROOM_H);
				}
			},
		};
	};
	
	return exports;
});

}());
