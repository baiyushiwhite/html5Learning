var WebSocketServer = require('ws').Server,
	server = new WebSocketServer({port: 8080});

server.on('connection', function connect(socket) {
	socket.on('message', function receive(message) {
		console.log(message);
		server.broadcast(message);
	});
});
server.broadcast = function (message) {
	server.clients.forEach(function each(client) {
		client.send(message);
	});
};
