(function() {

const audio = modules.define('audio')
.import('loader')
.export(function (defs) {
	
	const {loader} = defs;
	
	let soundCache = {};
	const soundList = [
		// TODO: Add more audio files to this list.
		'hello.wav',
		'nonexistant.wav'
	];
	
	// Sounds
	loader.addFormat({
		type: 'sound', 
		constructor: Audio, 
		load: function (resource, filename, cb) {
			resource.addEventListener('canplaythrough', cb, false);
			resource.addEventListener('error', cb, false);
			resource.src = filename;
		},
		extensions: ['wav'], 
		fallback: 'hello.wav'
	});	
	
	let exports = {
		
		MUTE: false,
		
		playSound(filename) {
			if (audio.MUTE) { return; }
			if(!soundCache.hasOwnProperty(filename)) {
				// Auto-load new sounds on request
				let sound = new Audio();
				let cacheLine = {sound, ready: false};
				
				sound.addEventListener("canplaythrough", function() {
					cacheLine.ready = true;
					sound.play();
				}, true);
				soundCache[filename] = cacheLine;
				sound.src = filename;
			} else {
				// Play sounds that already exist in the cache
				if(soundCache[filename].ready && !soundCache[filename].error)
					soundCache[filename].sound.play();
			}
		},
		
		loadSounds(cb) {
			loader.load(soundList).then(function () { 
				loader.load(['intro.mp3','loop.mp3']).then(cb); 
			});
			
			/*var numLoadedsounds = 0, i, snd, cacheLine;
			
			function updateCache(line) { return function (ev) {
				if (ev.type === 'error') {
					line.error = true;
					console.log('sound not loaded: '+ev.target.src);
				} else {
					line.ready = true;
				}
				
				++numLoadedsounds;
				if(numLoadedsounds == soundList.length) {
					console.log('finished loading sounds');
					cb();
				}
			}; }
			
			for(i = 0;  i < soundList.length;  ++i) {
				snd = new Audio();
				cacheLine = {sound: snd, ready: false, error: false};
				soundCache[soundList[i]] = cacheLine;
				// Call the callback after all images are loaded
				snd.addEventListener("canplaythrough", updateCache(cacheLine),false);
				// Skip this sound if it failed to load
				snd.addEventListener("error", updateCache(cacheLine),false);
				snd.src = soundList[i];
			}*/
		}
		
	};
	
	// Music is way more complicated
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	if(!AudioContext) {
		exports.loadMusic		= function() {};
		exports.resumeMusic	= function() {};
		exports.stopMusic		= function() {};
		
		return;  // EXIT THIS ENTIRE SCOPE
	}

	const audioContext = new AudioContext();
	
	loader.addFormat({
		type: 'music', 
		constructor: XMLHttpRequest,
		load: function (request, filename, cb) {
			request.open('GET', filename, true);
			request.responseType = 'arraybuffer';

			// Decode asynchronously
			request.onload = function () {
				audioContext.decodeAudioData(
					request.response,
					cb,
					function () { cb({type:'error'}); }
				);
			};
						
			try { request.send(); } 
			catch(unused) {}
		},
		extensions: ['mp3','ogg'], 
		fallback: 'hello.wav'
	});
	
	var loadSound = function(url, callback) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';

		// Decode asynchronously
		request.onload = function() {
			context.decodeAudioData(request.response, callback,
				function() {console.log('Error loading sound');});
		}
		try {
			request.send();
		} catch(unused) {
		}
	}
	var playSound = function(b, time, loop, pos) {
		var source = context.createBufferSource();
		b.source = source;
		source.buffer = b.buffer;
		source.loop = loop;
		source.connect(b.gain);
		source.start(context.currentTime + time, pos);
		b.startTime = context.currentTime + time - pos;
	}

	var intro = {};
	var loop = {};
	var pos = 0;

	var n = 2;
	var musicShouldBePlaying = false;
	var musicLoaded = function() {return n === 0;}
	var cb = function() {
		var introLength;
		if(--n > 0)
			return;

		if(musicShouldBePlaying)
			doResumeMusic();
	};
	var callback = function(b) {return function(buffer) {
		b.buffer = buffer;
		b.gain = context.createGain();
		b.gain.connect(context.destination);
		cb();
	};};

	exports.loadMusic = function() {
		loadSound('intro.mp3', callback(intro));
		loadSound('loop.mp3', callback(loop));
	};
	exports.stopMusic = function() {
		if(!musicShouldBePlaying) {
			console.log('stopMusic() called when music already stopped!');
			return;
		}

		musicShouldBePlaying = false;

		if(musicLoaded())
			doStopMusic();
	};

	var doStopMusic = function() {
		var introLength = intro.buffer.duration;
		var loopLength = loop.buffer.duration;

		if(intro.source) {
			intro.source.stop(0);
			intro.source.disconnect();
		}
		loop.source.stop(0);
		loop.source.disconnect();

		pos = (context.currentTime - intro.startTime);
		if(pos >= intro.buffer.duration) {
			pos = context.currentTime + introLength - loop.startTime;
			while(pos >= introLength + loopLength)
				pos -= loopLength;
		}
	};
	exports.resumeMusic = function() {
		if(musicShouldBePlaying) {
			console.log('resumeMusic() called when music already playing!');
			return;
		}

		musicShouldBePlaying = true;

		if(musicLoaded())
			doResumeMusic();
	};

	var doResumeMusic = function() {
		var introLength = intro.buffer.duration;
		if(pos < introLength) {
			playSound(intro, 0, false, pos);
			playSound(loop, introLength - pos, true, 0);
		} else {
			playSound(loop, 0, true, pos - introLength);
		}
	};
	
	return exports;
	
});

}());
