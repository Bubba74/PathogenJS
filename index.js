
const express = require('express');
const app = express();

var _dirname = "/home/henry/Downloads/computer/ACM Hack/Server/";
var clients_connected = 0;

var chats = [];

function updateClients(){
	for (var i=0; i<clients.length; i++){
		rng = Math.random();
		clients[i].send('<html><body>Clients Connected: '+clients.length+'</br>'+rng+'</body></html>');
	}
}
		
app.get('/page', function(request, response){
	response.sendFile(__dirname + "/pendulum.html")
});

app.get('/random', function(request,response) {
	rng = Math.random();
	request.on("close", function() {
		console.log("close")
  	});
  	
   	request.on("end", function() {
		console.log("end");
     		});
	response.send('<html><body>'+rng+'</body></html>');
	//response.end();
});

app.use(express.json())

app.post('/new-chat', function(req, resp){
	t0 = new Date()
	msg = req.body.msg;
	chats[chats.length] = msg
	console.log(msg)
	resp.end();
})

app.post('/update', function(req, resp){
	index = req.body.index
	//console.log("Update "+index+" "+chats)
	obj = {messages: chats.slice(index)}
	resp.send(JSON.stringify(obj))
	resp.end()
})


app.listen(8080);
