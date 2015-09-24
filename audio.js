(function() {

const audio = modules.define('audio')
.import('loader')
.export(function (defs) {

	const {loader} = defs;
	
	const soundList = [
		// TODO: Add more audio files to this list.
		'hello.wav',
		'nonexistant.wav'
	];
	
	
	// ----- Sounds -----
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
		MUTE:			false,
		musicPlaying:	false
	};
	
	exports.playSound = function (filename) {
		if (audio.MUTE) { return; }
		loader.get(filename).play();
	};
		
	exports.loadSounds = function (cb) {
		loader.load(soundList).then(cb);
	};
		
	// ----- Music -----
	const musicList = [
		{ name: 'battle', intro: 'music/battle_intro.ogg', loop: 'music/battle_loop.ogg' },
		{ name: 'dungeon', intro: 'music/dungeon_intro.ogg', loop: 'music/dungeon_loop.ogg' },
		{ name: 'lost', intro: 'music/lost.ogg' },
		{ name: 'victory', intro: 'music/victory.ogg' },
	];
	const songs = {};
	
	// Check for HTML Audio API support
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	if(!AudioContext) {
		exports.loadMusic	= function() {};
		exports.resumeMusic	= function() {};
		exports.stopMusic	= function() {};
		
		return;  // EXIT THIS ENTIRE SCOPE
	}
	
	// Create an audio context for music
	const audioContext = new AudioContext();
	
	// Add the "music" format to the loader
	loader.addFormat({
		type: 'music', 
		constructor: function () {
			return {
				buffer:		null,
				gain:		null,
				request:	new XMLHttpRequest()
			};
		},		
		load: function (resource, filename, cb) {
			resource.request.open('GET', filename, true);
			resource.request.responseType = 'arraybuffer';

			// Error state callback
			function sendError() { cb({type:'error', target: {src:filename}}); };
			
			// Decode asynchronously
			resource.request.onload = function () {
				audioContext.decodeAudioData(
					resource.request.response,
					musicOnDecode(resource,cb),
					sendError
				);
			};
						
			try { resource.request.send(); } 
			catch(unused) { sendError(); }
		},
		extensions: ['mp3','ogg'], 
		fallback: null
	});
	
	// Save buffer data from decoded music clip
	function musicOnDecode(clip, cb) { return function (buffer) {
		// This is Tommy's code
		clip.buffer	= buffer;
		clip.gain	= audioContext.createGain();
		clip.gain.connect(audioContext.destination);
		cb({});
	}; }
	
	// Play a music clip
	function playClip(clip, delay, loop, pos) {
		// This is Tommy's code
		var source = audioContext.createBufferSource();
		clip.source = source;
		source.buffer = clip.buffer;
		source.loop = loop;
		source.connect(clip.gain);
		source.start(audioContext.currentTime + delay, pos);
		clip.startTime = audioContext.currentTime + delay - pos;
	}
	// Stop a music clip & disconnect audio source
	function stopClip(clip) {
		if (clip.source) {
			clip.source.stop(0);
			clip.source.disconnect();
		}
	}
	
	// ----- Song object -----
	function Song(intro, loop) {
		this.introClip = loader.get(intro);
		if (this.introClip !== null) {
			this.introLength = this.introClip.buffer.duration;
		}
		
		this.loopClip = loader.get(loop);
		if (this.loopClip !== null) {
			this.loopLength = this.loopClip.buffer.duration;
		}
		
		this.pos = 0;
	}
	// Play song
	Song.prototype.play = function (pos) {
		if (pos !== undefined) { this.pos = pos; }
		
		if (this.pos < this.introLength) {
			const D = 0.1;  // A small delay; helps eliminate seams
			playClip(this.introClip, D, false, this.pos);
			if(this.loopClip !== null)
				playClip(this.loopClip, D + this.introLength - this.pos, true, 0);
		} else {
			if(this.loopClip !== null)
				playClip(this.loopClip, 0, true, this.pos - this.introLength);
		}
	};
	// Pause song
	Song.prototype.pause = function () {
		stopClip(this.introClip);
		if(this.loopClip !== null)
			stopClip(this.loopClip);
		
		this.pos = audioContext.currentTime - this.introClip.startTime;
		if (this.pos >= this.introLength && this.loopClip !== null) {
			this.pos = audioContext.currentTime + this.introLength - this.loopClip.startTime;
			while (this.pos >= this.introLength + this.loopLength)
				this.pos -= this.loopLength;
		}
	};
	// Stop song & reset to beginning
	Song.prototype.stop = function () {
		this.pause();
		this.pos = 0;
	};
	
	exports.loadMusic = function (cb) {
		var clips = Array.prototype.concat.apply([], musicList.map(function (x) {
			var subclips = [];
			if (x.intro !== undefined) subclips.push(x.intro);
			if (x.loop !== undefined) subclips.push(x.loop);
			return subclips;
		}));
		
		loader.load(clips).then(function () {
			musicList.map(function (x) {
				var song = new Song(x.intro, x.loop);
				songs[x.name] = song;
			});
			
			cb();
		});
	};
	
	exports.playMusic = function (song) {
		if (audio.MUTE) { return; }

		if (audio.currentSong !== song) {
			var lastSong = songs[audio.currentSong];
			if (lastSong) { lastSong.stop(); }
			audio.currentSong = song;
			songs[song].play(0);
		} else if (!audio.musicPlaying) {
			songs[song].play();
		}

		audio.musicPlaying = true;
	};
	
	return exports;
	
});

}());
