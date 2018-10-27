
const Pathogen = require('./public/scripts/pathogen.js')

const express = require('express');
const app = express();

var games = [];

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


app.post('/new-user', function(req, resp){
	let auth_key = getKey();
	let len = games.length;
	let player_id = -1;
	//If there are no games yet, or the last game is full
	if (!len || games[len-1].p2 !== '0'){
		games[len] = new Game();
		games[len].p1 = auth_key;
		player_id = 0;
	} else {
		games[len-1].p2 = auth_key;
		player_id = 1;
	}

	let data = {auth_key: auth_key, player_id: player_id};
	resp.send(JSON.stringify(data));
	resp.end();
});// new-user

app.post('/click', function(req, resp){
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
	games.forEach(function (game){
		if (game.click(auth_key, col, row, type))
			success = true;
	});// games

	//Send success bool back to client player
	let obj = {success: success};
	resp.send(JSON.stringify(obj));
	resp.end();
});// click

app.post('/update', function(req, resp){
	//JSON data
	let data = req.body;
	//User auth key
	let auth_key = data.auth_key;
	let index = data.turn_index;

	let turns;
	for (let i=0; i<games.length; i++){
		if (games[i].hasKey(auth_key)){
			turns = games[i].getTurns(index);
			break;
		}
	}

	let obj = {turns: turns};
	resp.send(JSON.stringify(obj));
	resp.end();
});// update

let port = 80;

let argv = process.argv;
if (argv.length > 2)
	try {
		port = parseInt(argv[2]);
	} catch (err){
		console.log(err);
	}

app.listen(port);
