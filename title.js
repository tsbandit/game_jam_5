/*var moduleName = "title";

window.modules = window.modules || {};
window.modules[moduleName] = (function () {
	// Title screen
	var exports = {};
	
	exports.initUi = function () {
		var Game = window.modules.game;
		var ui = {
			draw: function (ctx) {
				ctx.font = "bold 24pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText('TITLE GOES HERE', Game.WIDTH/2, Game.HEIGHT/5);

				Game.drawImage(ctx, 'gadage', 50, 50);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				Game.ui = modules.map_screen.initUi();
			},
		}
		return ui;
	};
	
	return exports;
}());*/

var title = modules.define('title')
.import('game')
.import('map_screen')
.export(function (defs) {
	// Title screen
	var game = defs.game;
	
	var exports = {};
	
	exports.initUi = function () {
		var ui = {
			draw: function (ctx) {
				ctx.font = "bold 24pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText('TITLE GOES HERE', game.WIDTH/2, game.HEIGHT/5);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				game.ui = defs.map_screen.initUi();
			},
		}
		return ui;
	};
	
	return exports;
});
