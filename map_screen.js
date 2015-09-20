(function() {

const map_screen = modules.define('map_screen')
.import('game')
.export(function (defs) {
	// Map screen
	const exports = {};
	
	exports.initUi = function () {
		const Game = defs.game;
		var ui = {
			draw: function (ctx) {
				for(let i=0; i<4; ++i)
					for(let j=0; j<4; ++j)
						Game.drawImage(ctx, 'All Doors Open Room.psd.png', 50+32*j, 50+27*i);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
			},
		}
		return ui;
	};
	
	return exports;
});

}());
