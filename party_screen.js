(function() {
   
const party_screen = modules.define('party_screen')
.import('game')
.export(function (defs) {
    
    const exports = {};
	const {game} = defs;
	exports.initUi = function (prevUi) {
			
		const ui = {
			draw: function (ctx) {
				ctx.font = "bold 24pt sans-serif";
				ctx.fillStyle = "#000";
				ctx.textAlign = "center";
				ctx.fillText('THIS IS YOUR PARTY', game.WIDTH/2, game.HEIGHT/5);
			},
			tick: function (elapsed) {
				
			},
			mouse_clicked: function(ev) {
				game.ui = prevUi;
			}
		};

		return ui;
	};
	
	return exports;
});

}());
