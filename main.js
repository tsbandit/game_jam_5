// Initialize the 'ui' object.
modules.define('main')
.import('input')
.import('game')
.import('util')
.import('title')
.import('image')
.import('battle')
.export(function (defs) {
	
const {game, util, input, title} = defs;

util.run_async(function*(resume) {
////////////////////////////////////////////////////////////////////////
// MAIN THREAD
	
	// Wait until the window 'load' event
	window.addEventListener('load', resume);
	yield;
	
	// Initialize canvas
	game.initCanvas();
	
	// Initialize input
	input.init();
	
	// Load images
	game.loadImages(resume);
	yield;
	
	game.ui = title.initUi();
// END OF MAIN THREAD
////////////////////////////////////////////////////////////////////////

});

});