var moduleName = "title";

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
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				Game.ui = {draw: ctx => ctx.fillText('foo',50,50)};
			},
		}
		return ui;
	};
	
	return exports;
}());
