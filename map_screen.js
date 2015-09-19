(function() {

const map_screen = modules.define('map_screen')
.import('game')
.export(function (defs) {
	// Map screen
	const exports = {};
	
	exports.initUi = function () {
		var Game = defs.game;
		var ui = {
			draw: function (ctx) {
				ctx.font = "bold 24pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";

				ctx.fillText('foo', Game.WIDTH/4, Game.HEIGHT/5);
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