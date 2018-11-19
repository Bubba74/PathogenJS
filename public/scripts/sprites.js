

class TextureAtlas {

	constructor (atlasUrl, onload=null){
		this.path = atlasUrl.substring(0, atlasUrl.lastIndexOf('/'))+"/";

		//Dictionary organization for loaded images (.img == Html object    .frame == frameAlignment)
		this.images = {};
		//Initialize null values for src image
		this.src = {url: null, image: null, canvas: null, context: null};
		//Initialize canvas buffer (to draw subtextures to, then convert to data
		this.buffer = {};
		this.buffer.canvas = document.createElement("canvas");
		this.buffer.context = this.buffer.canvas.getContext("2d");
		//Initialize null values for xml doc
		this.xmlDoc;
		this.atlas; //Contains the SubTextures
		this.__loadXmlDoc(atlasUrl, this.__loadImage);
		
		this.onload= onload;
	} //constructor

	__loadXmlDoc (xmlUrl, callback){
		//Store a reference to the TextureAtlas object
		let atlas = this;
		//Open and send request
		let req = new XMLHttpRequest();
		req.open('GET', xmlUrl);
		req.responseType = 'document';

		req.onload = function(){
			console.log("Loaded XML Document: "+xmlUrl);
			atlas.xmlDoc = this.response;
			//Sets 'atlas' as the 'this' context of callback
			callback.call(atlas);
		}
		req.send();

	} //loadXmlDoc

	__loadImage (){
		this.atlas = this.xmlDoc.getElementsByTagName("TextureAtlas")[0];
		this.subs = this.atlas.getElementsByTagName("SubTexture");

		this.src.url = this.path + this.atlas.getAttribute("imagePath");
		console.log("Loading Image: "+this.src.url);
		this.src.image = document.createElement("img");

		let self = this;
		this.src.image.onload = function(){
			self.src.canvas = document.createElement("canvas");
			self.src.canvas.width  = this.width;
			self.src.canvas.height = this.height;
			console.log(self.src.canvas);
			self.src.context = self.src.canvas.getContext('2d');
			self.src.context.drawImage(this, 0, 0, this.width, this.height);
			console.log("Done loading");
			if (self.onload) self.onload();
		};
		
		this.src.image.src = this.src.url;
	} //__loadImage

	static loadAttribs(element, obj, attribs){
		for (let i=0; i<attribs.length; i++){
			if (element.hasAttribute(attribs[i]))
				obj[attribs[i]] = element.getAttribute(attribs[i]);
		}
	} //loadAttribs

	getImageAndFrame (name){
		//Return cached image
		if (this.images.hasOwnProperty(name))
			return this.images[name];

		let sub;
		for (let i=0; i<this.subs.length; i++)
			if (this.subs[i].getAttribute("name") == name){
				sub = this.subs[i];
				break;
			}

		let box = {};
		TextureAtlas.loadAttribs(sub, box, ["x","y","width","height"]);
		
		this.buffer.canvas.width = box.width;
		this.buffer.canvas.height = box.height;
		this.buffer.context.clearRect(0, 0, box.width, box.height);
		this.buffer.context.drawImage(this.src.canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);

		//Create a new image and add the sub texture's source to it
		this.images[name] = {};
		this.images[name].img = document.createElement("img");
		
		this.images[name].img.src = this.buffer.canvas.toDataURL();
		this.images[name].frame = {};
		TextureAtlas.loadAttribs(sub, this.images[name].frame, ["x", "y", "width", "height"]);
		TextureAtlas.loadAttribs(sub, this.images[name].frame, ["frameX", "frameY", "frameWidth", "frameHeight"]);

		return this.images[name];
	} //getImageAndFrame

	hasImage (name){
		for (let i=0; i<this.subs.length; i++)
			if (this.subs[i].getAttribute("name") == name)
				return true;
		return false;
	} //hasImage

} //TextureAtlas

class TextureAtlasGroup {
	constructor (atlasUrls, onload=null){
		this.readyCount = 0;
		this.onload = onload;
		let tempThis = this;

		this.atlases = [];
		for (let i=0; i<atlasUrls.length; i++)
			this.atlases[i] = new TextureAtlas(atlasUrls[i], function(){tempThis.__ready.call(tempThis)});
	}

	getImageAndFrame (name){
		for (let i=0; i<this.atlases.length; i++)
			if (this.atlases[i].hasImage(name))
				return this.atlases[i].getImageAndFrame(name);
	} //getImageAndFrame

	hasImage (name){
		for (let i=0; i<this.atlases.length; i++)
			if (this.atlases[i].hasImage(name))
				return true;
		return false;
	} //hasImage

	__ready (){
		this.readyCount++;
		console.log("Ready");
		if (this.readyCount == this.atlases.length && this.onload)
			this.onload();
	}

} //TextureAtlasGroup

