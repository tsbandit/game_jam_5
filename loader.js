(function() {

const loader = modules.define('loader')
.import('util')
.export(function (defs) {
	
	const {util} = defs;	
	const cache = {};
	
	//const audioContext
	
	// File format identification
	const format = [];
	function getExtensionPattern(extensions) {
		return new RegExp('\.('+extensions.join('|')+')$');
	}
	function addFormat(options) {
		format.push({
			type:			options.type,
			constructor:	options.constructor,
			extensions:		options.extensions,
			fallback:		options.fallback,
			
			load:			options.load,
			onLoad:			options.onLoad || function (){},
			
			pattern:		getExtensionPattern(options.extensions)
		})
	}
	function getFormat(filename) {
		for (let i = 0; i < format.length; ++i) {
			if (format[i].pattern.test(filename)) return format[i];
		}
	}
	
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
			let format = getFormat(filename);
			
			let resource = new format.constructor();
			let cacheLine = { resource, format, ready: false, error: false };
			cache[filename] = cacheLine;
			
			format.load(resource, filename, updateCache(cacheLine));
		}
		
		return promise;
	}
	
	// Fetch a resource from the cache.
	function get(filename) {
		let cacheLine = cache[filename];
		if (cacheLine.ready && !cacheLine.error) {
			return cacheLine.resource;
		} else {
			return get(cacheLine.format.fallback);
		}
	}
	
	return {
		addFormat,
		load,
		get
	};
	
});

}());
