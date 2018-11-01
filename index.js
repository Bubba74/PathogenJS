
const Pathogen = require('./public/scripts/pathogen.js')

const express = require('express');
const app = express();

// Connections available
var active = [];
var lobby = [];

class Game {
	constructor(){
		this.p1 = '0';
		this.p2 = '0';
		this.game = new Pathogen(null);
		this.turns = [];
	}// constructor

	click(auth_key, col, row, type){
		if (this.p1 === '0' || this.p2 === '0') return false;

		let player = -1;
		if (auth_key === this.p1)
			player = 0;
		else if (auth_key === this.p2)
			player = 1;
		else
			return false;

		//Process move (if valid) and return success
		let success = this.game.click(col, row, player, type);
		if (success) {
			let turn = { col: col, row: row, player: player, type: type };
			this.turns[this.turns.length] = turn;
		}
		return success;
	}// click

	hasKey(auth_key){
		return this.p1 === auth_key || this.p2 === auth_key;
	}// haskey

	getTurns(index = 0){
		return this.turns.slice(index);
	}// getTurns

} //Game

function startGame(board){
	board.game = new Game();
	board.game.p1 = board.p1;
	board.game.p2 = board.p2;
} //startGame

function getKey(){
	let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let length = 10;
	let key = "";

	for (let i=0; i<length; i++)
		key += chars[Math.floor(Math.random()*chars.length)];
	return key;
}// getKey


app.use(express.static('public'));
app.use(express.json());

//Parse form data from POST
app.use(express.urlencoded({
    extended: true
}));
//app.use(bodyParser.json());


app.post('/new-user', function(req, resp){
	let auth_key = getKey();
	let data = {auth_key: auth_key};
	resp.send(JSON.stringify(data));
	resp.end();
});// new-user

app.post('/put-click', function(req, resp){
	//JSON data
	let data = req.body;
	//User auth key
	let auth_key = data.auth_key;
	//Click data
	let col = data.col;
	let row = data.row;
	let type = data.type;

	//Process click (only on game that has the auth_key
	//	this is checked in the click() function.
	let success = false;
	active.forEach(function (board){
		game = board.game;
		if (game.click(auth_key, col, row, type))
			success = true;
	});// games

	//Send success bool back to client player
	let obj = {success: success};
	resp.send(JSON.stringify(obj));
	resp.end();
});// put-click

app.post('/get-clicks', function(req, resp){
	//JSON data
	let data = req.body;
	//User auth key
	let auth_key = data.auth_key;
	let index = data.turn_index;

	let turns;
	for (let i=0; i<active.length; i++){
		if (active[i].game.hasKey(auth_key)){
			turns = active[i].game.getTurns(index);
			break;
		}
	}

	let obj = {turns: turns};
	resp.send(JSON.stringify(obj));
	resp.end();

	const used = process.memoryUsage().heapUsed / 1024 / 1024;
	console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
});// get-clicks

app.post('/new-game', function(req, resp){
	console.log("Creating new game for request: "+JSON.stringify(req.body));
	lobby[lobby.length] = {game:null, name:req.body.name , p1:req.body.auth_key , p2:-1 , width:req.body.width , height:req.body.height};
	lobby[lobby.length-1].starter = resp;
});// new-game

app.post('/join-game', function(req, resp){
	console.log("Joining game for request: "+JSON.stringify(req.body));
	let found = false;
	for (let i=0; i<lobby.length; i++){
		if (lobby[i].name == req.body.name){
			found = true;
			lobby[i].p2 = req.body.auth_key;
			lobby[i].starter.send(JSON.stringify({success: true}));
			lobby[i].starter.end();
			startGame(lobby[i]);
			active[active.length] = lobby[i];
			lobby.splice(i,1);
			break;
		}
	}
	resp.send(JSON.stringify({success: found}));
	resp.end();
});// join-game

let port = 80;

let argv = process.argv;
if (argv.length > 2)
	try {
		port = parseInt(argv[2]);
	} catch (err){
		console.log(err);
	}

app.listen(port);
