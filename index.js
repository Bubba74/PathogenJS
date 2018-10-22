
const express = require('express');
const app = express();

var _dirname = "/home/henry/Downloads/computer/ACM Hack/Server/";
var clients_connected = 0;

var chats = [];

app.get('/page', function(request, response){
	response.sendFile(__dirname + "/pendulum.html")
});

app.use(express.static('public'))

app.use(express.json())

/*
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
*/


app.listen(8080);
