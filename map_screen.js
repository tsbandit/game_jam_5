var moduleName = "map_screen";

window.modules = window.modules || {};
window.modules[moduleName] = (function () {
	// Title screen
	const exports = {};
	
	exports.initUi = function () {
		var Game = window.modules.game;
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
}());
