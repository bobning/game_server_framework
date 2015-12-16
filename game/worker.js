'use strict';
let cluster = require('cluster');
let hub = require('clusterhub');
let net = require('net');
let _ = require('lodash');

class Client {
	construtor(socket1) {
		this.socket = socket1;
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


let serverGame = net.createServer(function (socket) {
	
});


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