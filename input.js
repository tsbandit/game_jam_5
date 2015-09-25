(function() {

const input = modules.define('input')
.import('game')
.export(function (defs) {
	// Input
	var exports = {};
	
	exports.init = function () {
		const game = defs.game;
		
		// Install mouse handlers
		const rect = game.canvas.getBoundingClientRect();
		const cb = function (type) { return function(ev) {
			const event = {
				type: type,
				ev:   ev,
				mx:   ev.clientX - rect.left,
				my:   ev.clientY - rect.top,
			};
			if(type === 'mouse_moved') {
				input.mx = event.mx;
				input.my = event.my;
			}
			(game.ui[type] || (() => {})) (event);
		} };

		game.canvas.addEventListener('mousemove',    cb('mouse_moved'),    false);
		game.canvas.addEventListener('mousedragged', cb('mouse_moved'),    false);
		game.canvas.addEventListener('mousedown',    cb('mouse_clicked'),  false);
		game.canvas.addEventListener('mouseup',      cb('mouse_released'), false);
	};
	
	return exports;
});

}());
