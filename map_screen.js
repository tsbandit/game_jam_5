(function() {
   
const map_screen = modules.define('map_screen')
.import('audio')
.import('game')
.import('image')
.import('battle')
.import('party_screen')
.import('util')
.export(function (defs) {
    
	function Button(name) {
		this.name = name;
		this.fill = '#fff';
		
		this.x = 0;
		this.y = 0;
		this.w = 160;
		this.h = 30;
	};
	
	Button.prototype.over = function (mx, my) {
		return ((mx > this.x) && (mx < this.x+this.w) &&
				(my > this.y) && (my < this.y+this.h));
	};
	
	Button.prototype.draw = function (ctx) {
		ctx.fillStyle	= this.fill;
		ctx.fillRect(this.x, this.y, this.w, this.h);
		ctx.font = "bold 18pt sans-serif";
		ctx.fillStyle = "#000";
		ctx.textAlign = "center";
		ctx.fillText(this.name, this.x+(this.w/2), this.y+24);
	};
	
    const exports = {};
	const {audio,game,image,battle,util,party_screen} = defs;
	exports.initUi = function () {
		battle.initialize_allies();

		// Initialize battle.player_data
		{
			battle.player_data = {};
			const pd = battle.player_data;

			pd.equipment = [];
			pd.inventory = [];
		}

		audio.playMusic('dungeon');
				
		const party_button = new Button("Party");
		party_button.x = 400;
		party_button.y = 50;
		party_button.fill = '#99f';
		const equip_button = new Button('Equipment');
		equip_button.x = 400;
		equip_button.y = 100;
		equip_button.fill = '#99f';
				
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

		const make_room = function(grid, x, y, z) {
			// Legal types:
			//   'mob', 'empty', 'stair_forward', 'stair_backward', 'fountain'

			// Choose type randomly
			const rand = Math.random();
			let type;
			if(rand < 0.40)
				type = 'mob';
			else if(rand < 0.47)
				type = 'fountain';
			else if(rand < 0.54)
				type = 'treasure';
			else
				type = 'empty';

			const room = {
				type: type,
				x: x,
				y: y,
				visible: false,
				grid: grid,
			};

			util.dispatch(room, {
				mob: () =>
					room.enemies = battle.spawn_enemies(z),
				treasure: () =>
					room.contents = battle.random_loot(),
			});

			return room;
		};

		const generate_floor = function(z) {
			const grid = [];

			for(let i=0; i<6; ++i) {
				grid.push([]);
				for(let j=0; j<6; ++j)
					grid[i].push(make_room(grid, j, i, z));
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
			grid.stair_forward.type = 'boss';
			grid.stair_forward.enemies = battle.spawn_enemies(z);

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
				boss: () =>
					image.drawImage(ctx, 'room/boss.png', sx, sy),
				mob: ({enemies}) => {
					image.drawImage(ctx, 'char/wolf.png', sx, sy);

					ctx.fillStyle = 'white';
					ctx.font = 'bold 16px sans-serif';
					ctx.textAlign = 'right';
					ctx.fillText(enemies.length, sx+.9*ROOM_W, sy+.9*ROOM_H);
				},
				treasure: () =>
					image.drawImage(ctx, 'item/chest_gold.png', sx+4, sy+6),
				stair_forward: () =>
					image.drawImage(ctx, 'room/stairs_up.png', sx, sy),
				stair_backward: () =>
					image.drawImage(ctx, 'room/stairs_down.png', sx, sy),
				fountain: () =>
					image.drawImage(ctx, 'room/fountain.png', sx, sy),
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
				image.drawImage(ctx, 'char/hero0.png', sx, sy);

				// Display current floor number
				ctx.fillStyle = 'black';
				ctx.font = 'bold 24px sans-serif';
				ctx.textAlign = 'left';
				ctx.fillText(pz, 40, 40);
				
				// Draw ui
				party_button.draw(ctx);
				equip_button.draw(ctx);
			},
			tick: function (elapsed) {
				
			},
			mouse_moved: function({mx,my}) {
				if (party_button.over(mx,my)) {
					party_button.fill = '#00f';
				} else {
					party_button.fill = '#99f';
				}
				if (equip_button.over(mx,my)) {
					equip_button.fill = '#00f';
				} else {
					equip_button.fill = '#99f';
				}
			},
			mouse_clicked: function({mx,my}) {
				if (party_button.over(mx,my))
					return game.ui = battle.initUi(ui, pz, undefined);

				if(equip_button.over(mx,my))
					return game.ui = party_screen.initUi(ui);
				
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

				// TODO (Tommy): Maybe don't remove the mob until AFTER battle?
				util.dispatch(room, {
					boss: ({enemies}) => {
						room.type = 'stair_forward';

						return game.ui = battle.initUi(ui, pz, enemies);
					},
					mob: ({enemies}) => {
						room.type = 'empty';

						return game.ui = battle.initUi(ui, pz, enemies);
					},
					stair_forward: () => {
						++pz;
					},
					stair_backward: () => {
						--pz;
					},
					fountain: () => {
						room.type = 'empty';
						for(a of battle.allies)
							a.hp = a.maxhp;
					},
					treasure: ({contents}) => {
						room.type = 'empty';

						battle.player_data.equipment.push(contents);
					},
				});
			},
		};

		return ui;
	};
	
	return exports;
});

}());
