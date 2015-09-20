(function() {
   
const map_screen = modules.define('map_screen')
.import('game')
.import('image')
.import('battle')
.import('util')
.export(function (defs) {
    
    const exports = {};
	const {game,image,battle,util} = defs;
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

		const valid_coord = function(rx, ry) {
			return ry >= 0
			    && ry < grid.length
			    && rx >= 0
			    && rx < grid[ry].length;
		};

		const adjacents = function*({x,y}) {
			if(valid_coord(x-1, y))
				yield grid[y][x-1];
			if(valid_coord(x+1, y))
				yield grid[y][x+1];
			if(valid_coord(x, y-1))
				yield grid[y-1][x];
			if(valid_coord(x, y+1))
				yield grid[y+1][x];
		};

		const update_visibility = function() {
			const room = grid[py][px]
			room.visible = true;
			for(let r of adjacents(room))
				r.visible = true;
		}

		const make_room = function(x, y) {
			// Legal types: 'mob', 'empty', 'stair_forward'

			const type = (Math.random() < 0.3) ?  'mob' :  'empty';

			return {
				type: type,
				x: x,
				y: y,
				visible: false,
			};
		};

		// Generate the map
		{
			for(let i=0; i<4; ++i) {
				grid.push([]);
				for(let j=0; j<5; ++j)
					grid[i].push(make_room(j, i));
			}
			update_visibility();

			grid[py][px].type = 'empty';

			const stair_y = Math.floor(grid.length * Math.random());
			const stair_x = Math.floor(grid[stair_y].length * Math.random());
			grid[stair_y][stair_x].type = 'stair_forward';
		}

		const screen_coords = function(x, y) {
			const sx = BASE_X+ROOM_W*x;
			const sy = BASE_Y+ROOM_H*y;
			return [sx, sy];
		};

		const draw_room = function(ctx, x, y) {
			const room = grid[y][x];

			if(!room.visible)
				return;

			const [sx, sy] = screen_coords(x, y);

			image.drawImage(ctx, 'room/room.png', sx, sy);

			util.dispatch(room, {
				mob: () =>
					draw_disc(ctx, sx+ROOM_W/4, sy+ROOM_H/4, 8, 'red'),
				stair_forward: () =>
					image.drawImage(ctx, 'room/stairs_up.png', sx, sy),
			});
		};

		const ui = {
			draw: function (ctx) {
				for(let i=0; i<grid.length; ++i)
					for(let j=0; j<grid[i].length; ++j)
						draw_room(ctx, j, i);

				// Draw player
				const [sx, sy] = screen_coords(px, py);
				image.drawImage(ctx, 'char/hero.png', sx, sy);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function({mx,my}) {
				const rx = Math.floor((mx-BASE_X)/ROOM_W);
				const ry = Math.floor((my-BASE_Y)/ROOM_H);

				if(!valid_coord(rx,ry))
					return;

				const room = grid[ry][rx];

				if(!room.visible)
					return;

				px = rx;
				py = ry;
				update_visibility();

				if(room.type === 'mob') {
					const todo = x => console.log('TODO: '+x);
					todo("Maybe don't remove the mob until AFTER battle???");
					room.type = 'empty';

					return game.ui = battle.initUi(ui);
				}
			},
		};

		return ui;
	};
	
	return exports;
});

}());
