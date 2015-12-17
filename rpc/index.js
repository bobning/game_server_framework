'use strict';
let path = require('path');
let assert = require('assert');
let _ = require("lodash");

let protobuf = require("protobufjs");
protobuf.convertFieldsToCamelCase = false;

let builder = protobuf.loadProtoFile(path.join(__dirname, '../protocol/rpc.proto'));
assert(builder, "protobuf.loadProtoFile rpc.proto error");

let protocol = builder.build();
let rpc = protocol.rpc;
let Command = rpc.Command;

let fullName2Cmd = {};
let name2Cmd = {};
let cmd2Type = {};
let req2ReplyType = {};

let init = function() {
	_.each(Command, function(val, key) {
		let name = key.replace(/_/g, '');
		assert.equal(name, name.toUpperCase(), key + ' must Upper');
		name2Cmd[name] = val;
	});

	_.each(rpc, function(val, key) {
		if (typeof val != 'function' ) {
			return;
		}
		let cmd = name2Cmd[key.toUpperCase()];
		if (!cmd) {
			return;
		}
		cmd2Type[cmd] = val;
		let name = (new val).toString();
		fullName2Cmd[name] = cmd;
	});

	_.each(name2Cmd, function(cmd, name) {
		if (!name.match(/REQUEST$/)) {
			return;
		}
		let replyName = name.substring(0, name.length - 7);
		replyName += 'REPLY';
		let reply = name2Cmd[replyName];
		reply = cmd2Type[reply];
		if (reply) {
			req2ReplyType[cmd] = reply;
		}
	});

	console.log(req2ReplyType);
}

let write = function(conn, msg, usn) {
	let cmd = fullName2Cmd[msg.toString()];
	assert(cmd != null, 'command' + msg.toString() + 'not exist');
	let unit = new rpc.TransUnit({
		cmd: cmd,
		data: msg.encode(),
		usn: usn
	});
	return writeUnit(conn, unit);
}


init();
module.exports = rpc;