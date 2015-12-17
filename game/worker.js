'use strict';
let path = require('path');
let cluster = require('cluster');
let hub = require('clusterhub');
let net = require('net');
let _ = require('lodash');

let handlerMgr = require('./handlerMgr');
handlerMgr.register(path.join(__dirname, 'handlers'));


class Client {
	construtor(socket) {
		this.socket = socket;
	}

	nextReq() {

	}

	doneReq() {

	}

	addReq() {

	}

	send() {

	}

	reply() {

	}
}


class AccountManagement {
	construtor() {

	}

	online() {

	}

	onlined() {

	}

	offline() {

	}

	isOnline() {

	}

	isOnlineCb(msg) {

	}

	kick(id) {

	}

	broadcast(txt, tip, args) {

	}

	chat(info) {

	}

}


let accMgr = new AccountManagement();

// hub.on('broadcast', accMgr.broadcast);
// hub.on('chat', accMgr.chat);


let terminate = function () {
	console.log('terminateeeeeeee');
	process.exit();
};


process.on('message', function(msg) {
	if (null == msg.act) return;

	console.log('worker recv msg', msg);

	switch(msg.act) {
		case 'acc_on':
			return accMgr.onlined(msg.id);
		case 'is_online':
			return accMgr.isOnline(msg);
		case 'kick':
			accMgr.kick(msg.id);
			return process.send({
				act: 'kicked',
				id: msg.id
			});
		case 'term':
			return terminate();
	}
});


process.on('exit', function(code) {
	console.log("worker exit", code);
});


process.on('SIGINT', function() {
	terminate();
});


let serverGame = net.createServer(function (socket) {
	socket.setTimeout(90000);
	socket.setNoDelay(true);
	socket.setKeepAlive(true, 30000);
	let client = new Client(socket);

	socket.on('data', function(data) {
		console.log(data);
	});

	socket.on('close', function(had_error) {
		console.log('close', had_error);
	});

	socket.on('error', function(error) {
		console.log(error);
	});
});


serverGame.listen(8000, 'localhost');