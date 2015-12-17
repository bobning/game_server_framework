'use strict';

let assert = require('assert');
let fs = require('fs');
let path = require('path');
let _ = require('lodash');

let handlers = {};

exports.register =function (dir) {
	let files = fs.readdirSync(dir);
	let relative = path.relative(__dirname, dir);

	_.each(files, function(name) {
		if (name == 'index.js') {
			return;
		}
		if (path.extname(name) != '.js') {
			return;
		}

		let content = require('./' + path.join(relative, name));

		_.each(content.handlers, function  (func, cmd) {
			assert(handlers[cmd] == null, 'warning repeat registe message handler function: ' + cmd);
			handlers[cmd] = func;
		})
	});
};


exports.handle = function (done, unit) {
	let handler = handlers[unit.cmd];
	if (handler == null) {
		console.log('no handler for command', unit.cmd);
		return;
	}

	return handler.apply(handler, arguments);
};


exports.handleReq = function (done, req) {
	let handler = handlers[req.unitCommand];
	if (handler == null) {
		console.log('no handler for command', unit.cmd);
		return;
	}

	return handler.apply(handler, arguments);
};