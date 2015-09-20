(function() {
   
const map_screen = modules.define('map_screen')
.import('game')
.import('battle')
.export(function (defs) {
    
    const exports = {};
	
	exports.initUi = function () {
		const Game = defs.game;
		var ui = {
			draw: function (ctx) {
				for(let i=0; i<4; ++i)
					for(let j=0; j<4; ++j)
						Game.drawImage(ctx, 'Game Jam Rooms/Solid Room.png', 50+32*j, 50+32*i);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
                defs.game.ui = defs.battle.initUi();
			},
		}
		return ui;
	};
	
	return exports;
});

}());
