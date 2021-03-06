(function() {

const image = modules.define('image')
.import('loader')
.export(function (defs) {
	
	const {loader} = defs;
	
	let imageCache = {};
	const imageList = [
		'room/room.png',
		'char/hero0.png',
		'char/hero1.png',
		'char/hero2.png',
		'char/hero3.png',
		'room/left_open.png',
		'room/right_open.png',
		'room/up_open.png',
		'room/bottom_open.png',
		'room/stairs_up.png',
		'room/stairs_down.png',
		'room/fountain.png',
		'room/background.png',
		'ui/title.png',
		'hello.png',
		'char/wolf.png',
		'char/lobster.png',
		'char/tree.png',
		'char/bat.png',
		'char/blob.png',
		'char/lion.png',
		'room/boss.png',
		'item/chest_gold.png',
		'item/potion.png',
		'nonexistant.png',
	];
		
	loader.addFormat({
		type: 'image', 
		constructor: Image, 
		load: function (resource, filename, cb) {
			resource.addEventListener('load', cb, false);
			resource.addEventListener('error', cb, false);
			resource.src = filename;
		},
		extensions: ['png','jpg','gif','bmp'], 
		fallback: 'hello.png'
	});
		
	let exports = {
		
		drawImage(ctx, filename) {
			let imageArgs = Array.prototype.slice.call(arguments,2);
			let cachedImage = loader.get(filename);

			// Obvious, but not crash-y, indication that image is not in cache
			if(cachedImage === null)
				cachedImage = loader.get('hello.png');
			
			imageArgs.unshift(cachedImage);
			ctx.drawImage.apply(ctx,imageArgs);
		},
		
		loadImages(cb) {
			loader.load(imageList).then(cb);
			
			/*var numLoadedImages = 0, i, img;
			
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
			}*/
		}
		
	};
	
	return exports;
	
});

}());
