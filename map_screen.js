(function() {

const map_screen = modules.define('map_screen', {});

}());

(function() {
   
const map_screen_post = modules.define('map_screen_post')
.import('game')
.import('battle')
.import('map_screen')
.export(function (defs) {
    
    const exports = defs.map_screen;
	
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
                defs.game.ui = defs.battle.initUi();
			},
		}
		return ui;
	};
	
	return exports;
    
});
    
}());