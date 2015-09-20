(function() {

const loader = modules.define('loader')
.import('util')
.export(function (defs) {
	
	const {util} = defs;	
	const cache = {};
	
	// File format identification
	const format = [];
	function getExtensionPattern(extensions) {
		return new RegExp('\.('+extensions.join('|')+')$');
	}
	function addFormat(type, constructor, extensions, fallback) {
		format.push({
			type,
			constructor,
			extensions,
			fallback,
			
			pattern: getExtensionPattern(extensions)
		})
	}
	function getFormat(filename) {
		for (let i = 0; i < format.length; ++i) {
			if (format[i].pattern.test(filename)) return format[i];
		}
	}
	
	// Add default formats
	addFormat('image', Image, ['png','jpg','gif','bmp'], 'hello.png');
	addFormat('sound', Audio, ['wav'], 'hello.wav');
	addFormat('music', Audio, ['mp3','ogg']);
	
	// Load an arbitrary amount of arbitrary resources
	function load() {
		// Compile list of load targets from arguments
		let loadTargets = Array.prototype.concat.apply([],arguments);
		let loadedTotal = 0;
		let promise = new util.promise();
					
		// Callback for updating cache once a resource is loaded
		function updateCache(line) { return function (ev) {
			if (ev.type === 'error') {
				line.error = true;
				console.log('resource not loaded: '+ev.target.src);
			} else {
				line.ready = true;
			}
			
			++loadedTotal;
			if(loadedTotal == loadTargets.length) {
				console.log('finished loading batch beginning with '+loadTargets[0]);
				promise.resolve();
			}
		}; }
	
		// Initiate loading all files
		for (let i = 0, n = loadTargets.length; i < n; ++i) {
			const filename = loadTargets[i];
			let targetFormat = getFormat(filename);
			
			let resource = new targetFormat.constructor();
			let cacheLine = { resource, ready: false, error: false };
			cache[filename] = cacheLine;
			
			resource.addEventListener('load', updateCache(cacheLine), false);
			resource.addEventListener('error', updateCache(cacheLine), false);
			resource.src = filename;
		}
		
		return promise;
	}
	
	// Fetch a resource from the cache.
	function get(filename) {
		let cacheLine = cache[filename];
		if (cacheLine.ready && !cacheLine.error) {
			return cacheLine.resource;
		}
	}
	
	return {
		addFormat,
		load,
		get
	};
	
});

}());
