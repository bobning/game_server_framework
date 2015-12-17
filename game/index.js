'use strict';
let cluster = require('cluster');

// cluster.setupMaster({
//   exec: './game/worker.js',
//   args: null,
//   silent: false
// });


if (cluster.isMaster) {
	let net = require('net');
	let os = require('os');
	let _ = require('lodash');
	let numCPUs = os.cpus().length;
	let numWorkers = numCPUs / 2 + 1;
	let restartWorker = false;
	let willTerminate = false;

	setTimeout(function  () {
		restartWorker = true;
	}, 10 * 1000).unref();

	// TODO stat

	let accounts = {};

	class AccountInfo {
		construtor(id, workerId) {
			this.id = id;
			this.workerId = workerId;
			this._newWorkerId = null;
		}

		get newWorkerId() {
			return this._newWorkerId;
		}

		set newWorkerId(val) {
			this._newWorkerId = val
		}
	}

	class WorkerMessageHandler {
		construtor(workerId) {
			this.workerId = workerId;
		}

		send(targetWorkerId, msg) {
			let worker = cluster.workers[targetWorkerId];
			if (!worker) {
				return false;
			}
			worker.send(msg);
			return true;
		}

		online(accId, workerId) {
			if (workerId == null) {
				workerId = this.workerId;
			}
			accounts[accId] = new AccountInfo(accId, workerId);
			return this.send(workerId, {
				act: 'acc_on',
				id: accId
			});
		}

		on(msg) {
			console.log('WorkerMessageHandler on msg', msg)
			if (msg.act == null) {
				return;
			}
			let accId, info, res, sent;
			switch(msg.act) {
				case 'acc_on':
					accId = msg.id;
					info = accounts[accId];
					while (true) {
						if (!info) {
							break;
						}
						if (info.workerId == this.workerId) {
							break;
						}
						sent = this.send(info.workerId, {
							act: 'kick',
							id: accId
						});
						if (!sent) {
							break;
						}
						info.newWorkerId = this.workerId;
						return;
					}
					return this.online(accId);
				case 'acc_off':
					accId = msg.id;
					info = accounts[accId];
					if (info && info.workerId == this.workerId && (info.newWorkerId == null)) {
						return delete accounts[accId];
					}
				case 'is_online':
					for (let i in msg.ids) {
						if (accounts[i]) {
							res[i] = true;
						}
					}
					return this.send(this.workerId, {
						act: 'is_online',
						id: msg.id,
						res: res
					});
				case 'kicked':
					accId = msg.id;
					info = accounts[accId];
					if (info && info.workerId == this.workerId) {
						return this.online(accId, info.newWorkerId);
					}
			}

		}
	}

	cluster.on('online', function(worker) {
		console.log('online is :', worker.id);
		let handler = new WorkerMessageHandler(worker.id);
		worker.on('message', handler.on);
		// if (restartWorker) {
		// 	if (_.size(cluster.workers) < numWorkers) {
		// 		cluster.fork();
		// 	}
		// }
	});

	cluster.on('listening', function  (worker, address) {
		console.log("a worker is now connect to " + address.address + ":", address.port);
	});

	cluster.on('disconnect', function(worker) {
	  console.log('The worker #' + worker.id + ' has disconnected');
	});

	cluster.on('exit', function(worker, code, signal) {
		console.log("exittttttt");
	});

	process.on('SIGINT', function  () {
		_.each(cluster.workers, function(worker) {
			worker.send({
				act: 'term'
			});
		});
	});

	let controller = net.createServer(function(conn) {
	  let cmd = '';
	  conn.setEncoding('utf8');
	  conn.on('data', function(chunk) {
	    let ref, ref1;
	    cmd += chunk;
	    if (cmd.length > 12) {
	      return conn.end();
	    } else if (cmd.length >= 6) {
	      if (0 === cmd.lastIndexOf('rldcrzWrk', 0)) {
	        console.log("Restart workers because of controller cmd");
	        reloadAllWorkers();
	        conn.write('OK');
	        return conn.end();
	      }
	      if (0 === cmd.lastIndexOf('report', 0)) {
	        conn.write("name: game" + " port: 8000" + " data:" + chunk + " workers:" + (_.size(cluster.workers)) + "\r\n");
	        return conn.end();
	      }
	    }
	  });
	});

	controller.on('error', function  (err) {
		console.log(err)
	});

	let startGame = function () {
		// controller.listen(8001);
		for (let i = 0; i < numWorkers; i++) {
			cluster.fork();
		}
	};

	startGame()
} else {
	require('./worker');
}