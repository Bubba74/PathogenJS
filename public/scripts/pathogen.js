
class Pathogen {


	click (event_data) {
		let canvas = event_data.target,
		    screen = canvas.getContext('2d'),
		    game = canvas.game;

		let x = event_data.pageX - canvas.offsetLeft - 4,
		    y = event_data.pageY - canvas.offsetTop - 4;

		x = Math.floor(x/game.unit);
		y = Math.floor(y/game.unit);

		screen.moveTo(0,0);
		screen.lineTo(x*game.unit+game.unit/2, y*game.unit+game.unit/2);
		screen.stroke();
	}

	render () {
		this.canvas.style.borderColor = this.turn?this.p2color:this.p1color;
		let i=0, j=0;
		for (i=0; i<this.width; i++){
			for (j=0; j<this.height; j++){
				//Draw vertical grid line
				this.screen.moveTo(i*this.unit, 0);
				this.screen.lineTo(i*this.unit, this.height*this.unit);
				//Draw horizontal grid line
				this.screen.moveTo(0, 			 j*this.unit);
				this.screen.lineTo(this.width*this.unit, j*this.unit);
			}
		}
		this.screen.stroke();
		console.log("Updated screen");
	}

	constructor () {
	}
	
	init (canvas, config){
		this.width = config[0];
		this.height = config[1];

		this.canvas = canvas;
		this.screen = canvas.getContext("2d");

		this.canvas.height = config[3];
		this.unit = canvas.height/this.height;
		this.canvas.width = this.unit*this.width;
		this.canvas.game = this;

		this.canvas.addEventListener("click", this.click);

		this.turn = 1; //0 == Player 1
		this.p1color = "#ff0000";
		this.p2color = "#00ff00";
	}

}//Pathogen
