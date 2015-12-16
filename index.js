var game = require('./game');


// var cluster = require('cluster');
// var http = require('http');

// if (cluster.isMaster) {

//   // Keep track of http requests
//   var numReqs = 0;
//   setInterval(function() {
//     console.log("numReqs =", numReqs);
//   }, 1000);

//   // Count requests
//   function messageHandler(msg) {
//     if (msg.cmd && msg.cmd == 'notifyRequest') {
//       numReqs += 1;
//     }
//   }

//   // Start workers and listen for messages containing notifyRequest
//   var numCPUs = require('os').cpus().length;
//   for (var i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   Object.keys(cluster.workers).forEach(function(id) {
//     cluster.workers[id].on('message', messageHandler);
//   });

// } else {

//   // Worker processes have a http server.
//   http.Server(function(req, res) {
//     res.writeHead(200);
//     res.end("hello world\n");

//     // notify master about the request
//     process.send({ cmd: 'notifyRequest' });
//   }).listen(8000);
// }


// var cluster = require('cluster');
// var http = require('http');
// var numCPUs = require('os').cpus().length;

// if (cluster.isMaster) {
//     console.log("master start...");

//     // Fork workers.
//     for (var i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }


// 		cluster.on('online', function(worker) {
// 			console.log('online is :', worker.id);
// 		});

//     cluster.on('listening',function(worker,address){
//         console.log('listening: worker ' + worker.process.pid +', Address: '+address.address+":"+address.port);
//     });

//     cluster.on('exit', function(worker, code, signal) {
//         console.log('worker ' + worker.process.pid + ' died');
//     });
// } else {
//     // http.createServer(function(req, res) {
//     //     res.writeHead(200);
//     //     res.end("hello world\n");
//     // }).listen(0);
// 	process.on("message", function(msg) {
// 		console.log("dddddddddd")
// 	});
// }