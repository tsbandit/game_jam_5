(function() {

const title = modules.define('title')
.import('game')
.import('audio')
.import('map_screen')
.export(function (defs) {
	// Title screen
	const {game, audio, map_screen} = defs;
	
	var exports = {};
	
	exports.initUi = function () {
		var ui = {
			draw: function (ctx) {
				ctx.font = "bold 24pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText('DUNGEON SQUARE', game.WIDTH/2, game.HEIGHT/5);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				audio.playSound('hello.wav');
				game.ui = map_screen.initUi();
			},
		}
		return ui;
	};
	
	return exports;
});

}());