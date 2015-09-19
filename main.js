window.modules = window.modules || {};

// This function kind of spawns a new thread. Kind of.
// It should be called NEAR THE END of the current turn of the event loop.
const run_async = function(gen_fn) {
	const gen = gen_fn(x => gen.next(x).value);
	gen.next();
};

run_async(function*(resume) {
////////////////////////////////////////////////////////////////////////
// MAIN THREAD



// Wait until the window 'load' event
window.addEventListener('load', resume);
yield;

const assert = function(b) {
	if(b)
		return;

	debugger;
	throw 'assertion failure';
};

const WIDTH  = 640;
const HEIGHT = 480;

const Game = window.modules.game = window.modules.game || {};
Game.WIDTH = WIDTH;
Game.HEIGHT = HEIGHT;
const util = window.modules.util = window.modules.util || {};
util.assert = assert;
util.run_async = run_async;

// Create canvas
const canvas = document.createElement('canvas');
canvas.setAttribute('width',  WIDTH);
canvas.setAttribute('height', HEIGHT);
document.body.appendChild(canvas);

// This is the master handler. It's kind of a global.
let ui = {};
Object.defineProperty(modules.game, 'ui', {
	get: () => ui,
	set: x => ui = x,
});

// Utility function for temporarily changing the 'ui' object.
Game.delimit = function(new_ui, gen_func) {
	run_async(function*(resume) {
		const old_ui = ui;
		ui = new_ui;
		try {
			yield* gen_func(resume);
		} finally {
			ui = old_ui;
		}
	});
};

// Install animation-frame handler
{
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = 'red';

	let prev_timestamp = null;
	const anim = function(timestamp) {
		if(prev_timestamp === null)
			prev_timestamp = timestamp - 16;

		(ui.tick || (() => {})) (timestamp - prev_timestamp);

		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		(ui.draw || (() => {})) (ctx);

		prev_timestamp = timestamp;
		requestAnimationFrame(anim);
	};
	requestAnimationFrame(anim);
}

// Install mouse_moved handlers
{
	const rect = canvas.getBoundingClientRect();
	const cb = type => function(ev) {
		const event = {
			type: type,
			ev:   ev,
			mx:   ev.clientX - rect.left,
			my:   ev.clientY - rect.top,
		};
		(ui[type] || (() => {})) (event);
	};

	canvas.addEventListener('mousemove',    cb('mouse_moved'),   false);
	canvas.addEventListener('mousedragged', cb('mouse_moved'),   false);

	canvas.addEventListener('mousedown',    cb('mouse_clicked'), false);
}

// Utility function:  dispatch
// Usage:
//   obj = {type: 'TypeA', fieldA: 'foo'};
//   dispatch(obj, {
//     TypeA:   ({fieldA}) => {...},
//     TypeB:   ({fieldB}) => {...},
//     DEFAULT: event      => {...},
//   });
util.dispatch = function(discriminee, cases) {
	const f = cases[discriminee.type];
	if(f === undefined) {
		const g = cases.DEFAULT;
		if(g === undefined)
			return undefined;
		else if(typeof(g) === 'function')
			return g(discriminee);
		else
			return dispatch(discriminee, g);
	} else {
		return f(discriminee);
	}
};

util.barrier = function(spawner, cb) {
	let n_expected = 0;
	let n_done = 0;
	const results = [];
	spawner(function() {
		const n = n_expected;
		++n_expected;
		return function(r) {
			++n_done;
			results[n] = r;

			assert(n_done <= n_expected);
			if(n_done === n_expected)
				cb(results);
		};
	});
};

/*
util.barrier(k => {
	loadImage('foo.png', k());
	loadImage('bar.png', k());
}, resume);
yield;
*/

ui = modules.title.initUi();



// END OF MAIN THREAD
////////////////////////////////////////////////////////////////////////
});
