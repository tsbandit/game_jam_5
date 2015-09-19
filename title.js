/*var moduleName = "title";

window.modules = window.modules || {};
window.modules[moduleName] = (function () {
	// Title screen
	var exports = {};
	
	exports.initUi = function () {
		var ui = {
			draw: function (ctx) {
				var Game = window.modules.game;
				
				ctx.font = "bold 24pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText('TITLE GOES HERE', Game.WIDTH/2, Game.HEIGHT/5);
			},
			tick: function (elapsed) {
				
			}
		}
		return ui;
	};
	
	return exports;
}());*/

var title = modules.define('title')
.import('game')
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
				
			}
		}
		return ui;
	};
	
	return exports;
});