(function() {

const title = modules.define('title')
.import('game')
.import('audio')
.import('map_screen')
.import('image')
.export(function (defs) {
	// Title screen
	const {game, audio, map_screen, image} = defs;
	
	var exports = {};
	
	exports.initUi = function () {
		var ui = {
			draw: function (ctx) {
				image.drawImage(ctx, 'ui/title.png', 0, 0);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				//audio.playSound('hello.wav');
				game.ui = map_screen.initUi();
			},
		}
		return ui;
	};
	
	return exports;
});

}());
