
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
}//new_tile

function get_color(owner){
	let color;
	switch (owner){
	case -1:
		color = "#BBBBBB";
		break;
	case 0:
		color = "#81295a";
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
		ctx.beginPath();
		ctx.arc(x,y,r,0,2*Math.PI, false);
		ctx.fill();

		if (level > 1){
			ctx.beginPath();
			ctx.strokeStyle = "#FFFFFF";
			ctx.lineWidth = 2;
			ctx.arc(x,y,4.0*r/5,0,2*Math.PI, false);
			ctx.stroke();
		}
		if (level > 2){
			ctx.beginPath();
			ctx.fillStyle = "#FFFFFF";
			ctx.arc(x,y,r/5.0,0,2*Math.PI, false);
			ctx.fill();
		}
	}
}//draw_tile

class Pathogen {

	constructor (canvas){
		this.width = canvas.width;
		this.height = canvas.height;

		this.canvas = canvas;
		this.screen = canvas.getContext("2d");

		this.board = {
			unit: 20,
			width: 60,
			height: 40,
			x: (this.width-1200)/2,
			y: (this.height-800)/2
		};

		let b = this.board;
		this.tiles = [];
		for (let i=0; i<b.width; i++){
			let col = [];
			for (let j=0; j<b.height; j++)
				col[col.length] = new_tile();
			this.tiles[this.tiles.length] = col;
		}
		console.log(this.tiles);

		//Store instances of waves, to iterate over 1 at a time
		this.waves = [];
		this.waves_buf = [];

		this.turn = 1; //0 == Player 1
		this.p1color = "#00ff00";
		this.p2color = "#0000ff";
	}//constructor

	resetModifiers(){
		for (let i=0; i<this.board.width; i++)
			for (let j=0; j<this.board.height; j++)
				this.tiles[i][j].modified = 0;
	}//resetModifiers

	upgradeCell(col, row, owner, waveLevel){
		let tile = this.tiles[col][row];

		if (tile.modified) return;

		tile.modified = 1;
		//i.e. if it's a B-level upgrade, C-cells ignore the change
		if (tile.type > waveLevel) return;

		//empty, A-, and B-, cells (for B-wave) upgrade
		//B-cells upgrade to C-cells (and continue B-wave)
		//empty/A- cells upgrade to B-cells (and pass on A-wave)
		//		TODO -- there might be ambiguity if two waves approach at different times
		let newWaveLevel;
		if (tile.type == waveLevel){
			tile.type += 1;
			newWaveLevel = waveLevel;
		} else if (tile.type < waveLevel){
			tile.type = waveLevel;
			newWaveLevel = waveLevel-1;
		}
		tile.owner = owner;
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

	click (col, row, type) {
		if (this.waves.length) return;
		
		//Set it so no tiles have been modified
		this.resetModifiers();

		let new_owner = this.turn;
		let old_owner = this.tiles[col][row].owner;
		let old_type  = this.tiles[col][row].type;

		let same_owner = (old_owner == -1 || new_owner == old_owner);
		let upgrade_own_cell = same_owner && (old_type <= type);
		if (upgrade_own_cell){
			console.log("Upgrading cell!");
			this.upgradeCell(col, row, new_owner, type);
		}

		//After the initial germination, continuously update each wave by 1
		while (this.waves.length){
			//Swap waves and waves_buf arrays
			let temp = this.waves;
			this.waves = this.waves_buf;
			this.waves_buf = temp;
			
			//Process spread for each wave
			while (this.waves_buf.length){
				let wave = this.waves_buf.pop();
				this.upgradeCell(wave.x, wave.y, wave.owner, wave.level);
			}
		}

		console.log("Clicked ["+col+","+row+"] "+new_owner+":"+type);
		this.render();
		this.turn = 1 - this.turn;
		
	}//click


	render () {
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
				let x = b.x+i*b.unit+b.unit/2,
				    y = b.y+j*b.unit+b.unit/2;
				draw_tile(this.screen, x, y, b.unit/2, t.owner, t.type);
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
