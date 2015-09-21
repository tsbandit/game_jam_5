(function() {
   
const map_screen = modules.define('map_screen')
.import('audio')
.import('game')
.import('image')
.import('battle')
.import('util')
.export(function (defs) {
    
    const exports = {};
	const {audio,game,image,battle,util} = defs;
	exports.initUi = function () {
		audio.playMusic('dungeon');
				
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
		let pz = 0;
		let tower;   // Initialized later

		const update_visibility = function() {
			const room = tower(pz)[py][px];
			room.visible = true;
			for(let r of adjacents(room))
				r.visible = true;
		};

		const valid_coord = function(rx, ry, grid) {
			if(grid === undefined)
				grid = tower(pz);

			return ry >= 0
			    && ry < grid.length
			    && rx >= 0
			    && rx < grid[ry].length;
		};

		const adjacents = function*({grid,x,y}) {
			if(valid_coord(x-1, y, grid))
				yield grid[y][x-1];
			if(valid_coord(x+1, y, grid))
				yield grid[y][x+1];
			if(valid_coord(x, y-1, grid))
				yield grid[y-1][x];
			if(valid_coord(x, y+1, grid))
				yield grid[y+1][x];
		};

		const make_room = function(grid, x, y) {
			// Legal types: 'mob', 'empty', 'stair_forward', 'stair_backward'

			const type = (Math.random() < 0.3) ?  'mob' :  'empty';

			return {
				type: type,
				x: x,
				y: y,
				visible: false,
				grid: grid,
			};
		};

		const generate_floor = function(z) {
			const grid = [];

			for(let i=0; i<4; ++i) {
				grid.push([]);
				for(let j=0; j<5; ++j)
					grid[i].push(make_room(grid, j, i));
			}

			// Generate the staircase backward if necessary
			if(z === 0) {
				grid.stair_backward = grid[0][0];
				grid[0][0].type = 'empty';
			} else {
				const x = tower(z-1).stair_forward.x;
				const y = tower(z-1).stair_forward.y;
				grid.stair_backward = grid[y][x];
				grid.stair_backward.type = 'stair_backward';
			}

			// Set some rooms to be visible
			grid.stair_backward.visible = true;
			for(let r of adjacents(grid.stair_backward))
				r.visible = true;

			// Generate the staircase forward
			do {
				const y = Math.floor(grid.length * Math.random());
				const x = Math.floor(grid[y].length * Math.random());
				grid.stair_forward = grid[y][x];
			} while(grid.stair_forward === grid.stair_backward);
			grid.stair_forward.type = 'stair_forward';

			return grid;
		};

		const screen_coords = function(x, y) {
			const sx = BASE_X+ROOM_W*x;
			const sy = BASE_Y+ROOM_H*y;
			return [sx, sy];
		};

		const draw_room = function(ctx, x, y) {
			const room = tower(pz)[y][x];

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

		const tower_cache = [];
		tower = function(z) {
			if(tower_cache[z] === undefined)
				tower_cache[z] = generate_floor(z);

			return tower_cache[z];
		};

		const ui = {
			draw: function (ctx) {
				const grid = tower(pz);

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

				const room = tower(pz)[ry][rx];

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
