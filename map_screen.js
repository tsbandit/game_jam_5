(function() {
   
const map_screen = modules.define('map_screen')
.import('game')
.import('battle')
.export(function (defs) {
    
    const exports = {};
	const {game,battle} = defs;
	exports.initUi = function () {
		const BASE_X = 50;
		const BASE_Y = 50;
		const ROOM_W = 32;
		const ROOM_H = 32;

		let px = 0;
		let py = 0;

		return {
			draw: function (ctx) {
				// For debugging purposes
				ctx.textAlign = 'left';
				ctx.font = '16px sans-serif';
				ctx.fillText('Click here to enter battle', 0, 30);

				for(let i=0; i<4; ++i)
					for(let j=0; j<4; ++j)
						game.drawImage(ctx, 'Game Jam Rooms/Solid Room.png', BASE_X+ROOM_W*j, BASE_Y+ROOM_H*i);

				// Draw player
				ctx.beginPath();
				ctx.arc(BASE_X+(px+.5)*ROOM_W,BASE_Y+(py+.5)*ROOM_H,12,0,Math.PI*2);
				ctx.fill();
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function({mx,my}) {
				// For debugging purposes
				if(mx < 178 && my < 50)
					return game.ui = battle.initUi();

				//
			},
		};
	};
	
	return exports;
});

}());
