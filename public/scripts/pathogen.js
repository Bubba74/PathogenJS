
var A_CELL = 1;
var B_CELL = 2;
var C_CELL = 3;
var VIRUS  = 4;

function new_tile (){
	return {
		owner: -1,
		type:   0,
		modified: 0
	};
} //new_tile

function get_color(owner){
	let color;
	switch (owner){
	case -1:
		color = "#BBBBBB";
		break;
	case 0:
		color = "#CC2277";
		break;
	case 1:
		color = "#4bb294";
		break;
	}
	return color;
}


function draw_tile(ctx, x, y, r, owner, level){
	//Set pen color
	let color = get_color(owner);
	ctx.fillStyle = color;

	//Draw plain rectangle
	if (owner == -1)
		ctx.fillRect(x-0.75*r, y-0.75*r, 1.5*r, 1.5*r);
	else {
		if (level > 3){
			ctx.fillStyle = get_color(owner);
			ctx.fillRect(x-0.75*r, y-0.75*r, 1.5*r, 1.5*r);
		} else {
			ctx.beginPath();
			ctx.arc(x,y,3.0*r/5,0,2*Math.PI, false);
			ctx.fill();
			if (level > 1){
				ctx.beginPath();
				ctx.strokeStyle = "#FFFFFF";
				ctx.lineWidth = 2;
				ctx.arc(x,y,3.0*r/5,0,2*Math.PI, false);
				ctx.stroke();
			}
			if (level > 2){
				ctx.beginPath();
				ctx.fillStyle = "#FFFFFF";
				ctx.arc(x,y,r/5.0,0,2*Math.PI, false);
				ctx.fill();
			}
		}
	}
}//draw_tile

function draw_tile_image(ctx, left, top, w, owner, level){
	//Draw background TODO: get rid of this
	ctx.fillStyle = "#BBBBBB";
	ctx.fillRect(left+2, top+2, w-4, w-4);

	if (owner == -1) return;

	let type = ['A', 'B', 'C', 'W'];
	let img_name = "cell_" + owner + type[level-1];
	let img = document.getElementById(img_name);
	console.log("Img src: "+img_name);

	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(img, left, top, w, w);
}
	

function get_cell_timer(){
	let timer = {};
	timer.B = 4;
	timer.C = 8;
	timer.V = 10;
	return timer;
}// get_cell_timers

function update_cell_timer(timer){
	if (timer.B < 8)
		timer.B += 1;
	if (timer.C < 16)
		timer.C += 1;
}// update_cell_timers


class Pathogen {

	constructor (canvas){
		if (canvas){
			this.width = canvas.width;
			this.height = canvas.height;
	
			this.canvas = canvas;
			this.screen = canvas.getContext("2d");

			this.p1panel = document.getElementById("p1-controls");
			this.p2panel = document.getElementById("p2-controls");
			console.log("p1panel");
			console.log(this.p1panel);

			this.useControlPanels = !(this.p1panel == null || this.p2panel == null);
		}

		let u=30, w=30, h=20;
		this.board = {
			unit: u,
			width: w,
			height: h,
			x: (this.width-u*w)/2,
			y: (this.height-u*h)/2
		};

		//Position control panels
		if (this.useControlPanels){
			let b = this.board;
			this.p1panel.style.left = "" + ((b.x-this.p1panel.offsetWidth)/2) + "px";
			this.p1panel.style.top  = "" + (b.y + (b.unit*b.height)/2 - this.p1panel.offsetHeight/2) + "px";
			//Panel
			this.p2panel.style.left = "" + (b.x+b.width*b.unit+(b.x-this.p2panel.offsetWidth)/2) + "px";
			this.p2panel.style.top  = "" + (b.y + (b.unit*b.height)/2 - this.p2panel.offsetHeight/2) + "px";
			console.log("Panel1: ["+this.p1panel.offsetWidth+","+this.p2panel.offsetHeight);
			console.log("Panel1: ["+this.p2panel.style.left+","+this.p2panel.style.top+"]");
		}

		let b = this.board;
		this.tiles = [];
		for (let i=0; i<b.width; i++){
			let col = [];
			for (let j=0; j<b.height; j++)
				col[col.length] = new_tile();
			this.tiles[this.tiles.length] = col;
		}

		//Store instances of waves, to iterate over 1 at a time
		this.waves = [];
		this.waves_buf = [];
		this.busy = false;
		this.animation_delay = 300;

		this.turn = 0; //0 == Player 1
		this.p1color = "#00ff00";
		this.p2color = "#0000ff";

		this.p1timer = get_cell_timer();
		this.p2timer = get_cell_timer();
	}//constructor

	resetModifiers(){
		for (let i=0; i<this.board.width; i++)
			for (let j=0; j<this.board.height; j++)
				this.tiles[i][j].modified = 0;
	}//resetModifiers

	//override -- in the instance of a click, the cell should be
	//	overridden to C-level, afterwards, don't override
	upgradeCell(col, row, owner, waveLevel, override){
		let tile = this.tiles[col][row];

		if (tile.modified) return;

		//i.e. if it's a B-level upgrade, C-cells ignore the change
		if (tile.type > waveLevel) return;

		//empty, A-, and B-, cells (for B-wave) upgrade
		//B-cells upgrade to C-cells (and continue B-wave)
		//empty/A- cells upgrade to B-cells (and pass on A-wave)
		//		TODO -- there might be ambiguity if two waves approach at different times
		let newWaveLevel;
		//Special case for C-level wave
		if (waveLevel >= 4){
			//Store the first tile's type in the waveLevel variable
			if (override) {
				newWaveLevel = 10 + tile.type;
				tile.owner = -1;
				tile.type = 0;
			} else newWaveLevel = waveLevel;
			//If the types match, delete the tile and output a pulse of the same level
			if (tile.type == waveLevel%10){
				tile.owner = -1;
				tile.type = 0;
			}
		} else if (waveLevel == 3){
			//Upgrade connected C-cells to walls
			if (tile.type == waveLevel){
				tile.type += 1;
				newWaveLevel = waveLevel;
				tile.owner = owner;
				tile.modified = 1;
			//If the c-cell was placed directly on the board,
			//  turn the cell to a C-cell and emit a B-wave
			} else if (override){
				tile.type = waveLevel;
				newWaveLevel = waveLevel-1;
				tile.owner = owner;
				tile.modified = 1;
			//If the c-wave was spread from another c-cell,
			//  do nothing
			} else {
				newWaveLevel = 0;
			}
		} else {
			if (tile.type == waveLevel){
				tile.type += 1;
				newWaveLevel = waveLevel;
			} else if (tile.type < waveLevel){
				tile.type = waveLevel;
				newWaveLevel = waveLevel-1;
			}
			tile.owner = owner;
			tile.modified = 1;
		}
		if (override)
			this.render();
		this.upgradeAdjacent(col, row, owner, newWaveLevel);
	}//upgradeCell

	upgradeAdjacent(col, row, owner, waveLevel){
		//End recursion when wave-level is 0
		//i.e. a blank cell was upgraded to an A-cell
		//and thus emitted an A(1)-1==0 wave level.
		if (waveLevel > 0);
		else return;

		let w = this.board.width, h = this.board.height;
		//Scan through circle
		//    />0-v
		//    3   1
		//    ^-2</
		let deltaX = [0,1,0,-1], deltaY = [-1,0,1,0];
		for (let i=0; i<4; i++){
			let x = col + deltaX[i];
			let y = row + deltaY[i];
			//If the adjacent cell is within bounds, post a new wave spot
			if (x < 0 || x >= w || y < 0 || y >= h);
			else
				this.waves[this.waves.length] = {x:x, y:y, level:waveLevel, owner:owner};
		}
	}//upgradeAdjacent

	//TODO C-cell -> WALL does not emit C-level wave

	isValidClick (col, row, new_owner, type){
		if (new_owner !== this.turn) return false;
		if (col < 0 || col >= this.tiles.length || row < 0 || row >= this.tiles[0].length) return false;

		let old_owner = this.tiles[col][row].owner;
		let old_type  = this.tiles[col][row].type;

		//Special return case for Virus placement
		if (type == 4){
			if (old_owner != -1 && old_type != 4) //Some sort of non-wall cell occupies this tile
				return true;
		}

		console.log("Checking click: "+[old_owner,old_type]+" --> "+[new_owner,type]);
		//If empty cell
		if (old_owner == -1) return true;
		
		//If owned
		if (old_owner === new_owner){
			//Action must be an upgrade
			if (old_type <= type)
				return true;
			else { //i.e. no B-cell onto C-cell
				this.clickError = "Cannot place a "+type+" on a "+old_type;
				return false;
			}
		}
		
		//If not owned
		if (old_owner !== new_owner){
			console.log("Trying to take oppoenent's tile")
			//Action must be a force upgrade
			if (old_type < type)
				return true;
			else {
				this.clickError = "Cannot place a "+type+" on an enemies "+old_type;
				return false;
			}
		}


	}//isValidClick
	
	processCellSelection (new_owner, type){
		//If no more uses of that cell-type are available
		let timer = (new_owner == 0 ? this.p1timer : this.p2timer);
		let success = false;
		switch (type){
		case 1:
			success = true;
			break;
		case 2: //B-Cell
			if (timer.B < 4){
				this.clickError = "Player "+new_owner+" has no available B-cells";
				success = false;
			} else {
				timer.B -= 4;
				success = true;
			}
			break;
		case 3: //C-Cell
			if (timer.C < 8){
				this.clickError = "Player "+new_owner+" has no available C-cells";
				success = false;
			} else {
				timer.C -= 8;
				success = true;
			}
			break;
		case 4: //Virus
			if (timer.V < 10){
				this.clickError = "Player "+new_owner+" has no available Viruses";
				success = false;
			} else {
				timer.V -= 10;
				success = true;
			}
			break;
		default:
			this.clickError = "Unknown cell type: "+type;
			success = false;
			break;
		}
		console.log(timer);
		if (success)
			update_cell_timer(timer);
		return success;
	}// ifAvailableUseCell

	click (col, row, new_owner, type) {
		if (this.busy) return false;
		this.busy = true;

		if (type < 1) type = 1;
		if (type > 4) type = 4;
		
		//Set it so no tiles have been modified
		this.resetModifiers();


		//Check that the requested click is valid
		if (!this.isValidClick(col, row, new_owner, type)) {
			console.log(this.clickError);
			this.busy = false;
			return false;
		}

		//Check that the user can use the B-Cell, C-Cell, etc.
		//	AND reduce the appropriate timer
		if (!this.processCellSelection(new_owner, type)) {
			console.log(this.clickError);
			this.busy = false;
			return false;
		}

		//Click must be valid, upgrade the target cell
		console.log("Upgrading cell!");
		this.upgradeCell(col, row, new_owner, type, true);

		console.log("Clicked ["+col+","+row+"] "+new_owner+":"+type);
		setTimeout(this.processWaves, this.animation_delay, this);
		return true;
	}//click

	processWaves(obj){
		console.log("Turn: "+obj.turn);
		
		//Swap waves and waves_buf arrays
		let temp = obj.waves;
		obj.waves = obj.waves_buf;
		obj.waves_buf = temp;
		console.log(obj.waves);
		
		//Process spread for each wave
		while (obj.waves_buf.length){
			let wave = obj.waves_buf.pop();
			obj.upgradeCell(wave.x, wave.y, wave.owner, wave.level, false);
		}
		obj.render();
	
		if (obj.waves.length)
			setTimeout(obj.processWaves, obj.animation_delay, obj);
		else {
			obj.turn = 1 - obj.turn;
			obj.busy = false;
		}
	}//click


	render () {
		if (!this.canvas) return;
		this.screen.clearRect(0,0,this.canvas.width,this.canvas.height);
		this.renderBorder();
		this.screen.strokeStyle = "#000000";
		let b = this.board;
		for (let i=0; i<b.width; i++){
			for (let j=0; j<b.height; j++){
				//Draw vertical grid line
				this.screen.moveTo(b.x+i*b.unit, b.y);
				this.screen.lineTo(b.x+i*b.unit, b.y+b.height*b.unit);
				//Draw horizontal grid line
				this.screen.moveTo(b.x, b.y+j*b.unit);
				this.screen.lineTo(b.x+b.width*b.unit, b.y+j*b.unit);
			}
		}
		//Draw far right / far bottom border lines
		this.screen.moveTo(b.x+b.width*b.unit, b.y);
		this.screen.lineTo(b.x+b.width*b.unit, b.y+b.height*b.unit);
		this.screen.moveTo(b.x	      , b.y+b.height*b.unit);
		this.screen.lineTo(b.x+b.width*b.unit, b.y+b.height*b.unit);
		//Process line commands
		this.screen.stroke();
				
			
		for (let i=0; i<b.width; i++)
			for (let j=0; j<b.height; j++){
				let t = this.tiles[i][j];
				//Draw cell color
				let left = b.x+i*b.unit,
				    top  = b.y+j*b.unit;
				draw_tile_image(this.screen, left, top, b.unit, t.owner, t.type);
			}
		
	}//render

	renderBorder (){
		this.screen.fillStyle = get_color(1-this.turn);
		let b = this.board;
		let ctx = this.screen;

		//Top bar
		ctx.fillRect(b.x-5, b.y-5, b.width*b.unit+10, 5);
		//Bottom bar
		ctx.fillRect(b.x-5, b.y+b.height*b.unit, b.width*b.unit+10, 5);

		//Left bar
		ctx.fillRect(b.x-5, b.y-5, 5, b.height*b.unit+10);
		ctx.fillRect(b.x+b.width*b.unit, b.y-5, 5, b.height*b.unit+10);
	}//renderBorder

}//Pathogen

module.exports = Pathogen;
