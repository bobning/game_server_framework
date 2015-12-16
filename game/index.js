'use strict';
let cluster = require('cluster');
let hub = require('clusterhub');

cluster.setupMaster({
  exec: './game/worker.js',
  args: null,
  silent: false
});


if (cluster.isMaster) {
	let net = require('net');
	let os = require('os');
	let _ = require('lodash');
	let numCPUs = os.cpus().length;
	let numWorkers = numCPUs / 2 + 1;

	let restartWorker = false;
	// setTimeout(function  () {
	// 	restartWorker = true;
	// }, 1000).unref();

	cluster.on('online', function(worker) {
		// let handler = new WorkerMessageHandler(worker.id);
		console.log('online is :', worker.id);
		// worker.on('message', )
		// if (restartWorker) {
		// 	if (_.size(cluster.workers) < numWorkers) {
		// 		cluster.fork();
		// 	}
		// }

		// worker.on('message', function(msg) {
		// 	console.log('aaaaaaaaaaa', msg)
		// });
	});

	cluster.on('listening', function  (worker, address) {
		console.log("a worker is now connect to " + address.address + ":", address.port);
	});

	cluster.on('disconnect', function(worker) {
	  console.log('The worker #' + worker.process.pid + ' has disconnected');
	});

	cluster.on('exit', function(worker, code, signal) {

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
		// controller.listen(8000);
		// for (let i = 0; i < numWorkers; i++) {
			cluster.fork();
		// }
	};

	startGame()
}