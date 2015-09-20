(function() {

const image = modules.define('image', function (defs) {
	
	let imageCache = {};
	const imageList = [
		'Game Jam Rooms/Solid Room.png',
		'Game Jam Art/Blue Hair Sprite finish.png',
		'Game Jam Items/Stairs Acending stairs.png',
		'hello.png',
		'nonexistant.png'
	];
		
	let exports = {
		
		drawImage(ctx, filename) {
			let imageArgs = Array.prototype.slice.call(arguments,2);
			let cachedImage = imageCache[filename];
				
			// Obvious, but not crash-y, indication that image is not in cache
			if (cachedImage === undefined) { cachedImage = imageCache['hello.png']; }
			
			imageArgs.unshift(cachedImage);
			ctx.drawImage.apply(ctx,imageArgs);
		},
		
		loadImages(cb) {
			var numLoadedImages = 0, i, img;
			
			function updateCache(ev) {
				if (ev.type === 'error') {
					console.log('image not loaded: '+ev.target.src);
				}
				
				++numLoadedImages;
				if(numLoadedImages == imageList.length) {
					console.log('finished loading images');
					cb();
				}
			}
			
			console.log('loading images');
			for(i = 0;  i < imageList.length;  ++i) {
				img = new Image();
				const image_name = imageList[i];
				imageCache[imageList[i]] = img;
				// Call the callback after all images are loaded
				img.onload = updateCache;
				img.onerror = updateCache;
				img.src = imageList[i];
			}
		}
		
	};
	
	return exports;
	
});

}());
