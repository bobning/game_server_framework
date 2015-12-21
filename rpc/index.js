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
}

let writeUnit = function(conn, unit) {
  let bufData, bufLen, cmd, len, msgType, raw, v;
  bufData = unit.encode().toBuffer();
  len = bufData.length;
  if (len <= 0) {
    return;
  }
  if (len > 1e7) {
    console.log({
      length: bufData.length
    }, "message too large");
    assert(false, "message too large");
  }
  if (conn) {
    while (len > 0) {
      if (len > 0x7FFF) {
        v = (len & 0x7FFF) + 0x8000;
      } else {
        v = len;
      }
      len >>= 15;
      bufLen = new Buffer(2);
      bufLen.writeUInt16BE(v, 0);
      conn.write(bufLen);
    }
    conn.write(bufData);
  } else {
    console.log("发送消息时没有找到连接");
  }
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

let read = function(socket, data, unitHandler) {
  let e, endIndex, index, len, ref, ref1, unit;
  if (socket.p_ignore) {
    return;
  }
  if (socket.p_read_buffer) {
    data = Buffer.concat([socket.p_read_buffer, data]);
    delete socket.p_read_buffer;
  }
  if (data.length < 1) {
    return;
  }
  index = 0;
  while (true) {
    if (socket.p_read_length) {
      endIndex = index + socket.p_read_length;
      if (data.length >= endIndex) {
        try {
          unit = rpc.TransUnit.decode(data.slice(index, endIndex));
        } catch (_error) {
          e = _error;
          log.error({
            size: socket.p_read_length,
            data: data.slice(index, endIndex).toString('hex'),
            conn: socket.connStr,
            iS: index,
            iE: endIndex
          }, "Failed to parse TransUnit");
          socket.p_ignore = true;
          break;
        }
        if (unit.cmd === rpc.Command.PING) {
          unit.cmd = rpc.Command.PONG;
          if (unit.client_time_ms != null) {
            unit.server_time_ms = Date.now();
          }
          writeUnit(socket, unit);
        } else {
          unitHandler(unit);
        }
        delete socket.p_read_length;
        index = endIndex;
      } else {
        break;
      }
    } else {
      if (socket.p_read_len_base == null) {
        socket.p_read_len_base = 1;
      }
      if (data.length >= index + 2) {
        len = data.readUInt16BE(index);
        index += 2;
        if (len > 0x7FFF) {
          socket.p_read_len_fix = ((ref = socket.p_read_len_fix) != null ? ref : 0) + (len - 0x8000) * socket.p_read_len_base;
          socket.p_read_len_base <<= 15;
        } else {
          socket.p_read_length = ((ref1 = socket.p_read_len_fix) != null ? ref1 : 0) + len * socket.p_read_len_base;
          delete socket.p_read_len_fix;
          delete socket.p_read_len_base;
        }
      } else {
        break;
      }
    }
  }
  if (index < data.length) {
    return socket.p_read_buffer = data.slice(index);
  }
}


let readRequest = function(client, data, reqHandler) {
  let unitHandler = function(unit) {
    var e, replyType, req, reqType;
    replyType = rpc.reqToReplyType[unit.cmd];
    if (replyType == null) {
      log.warn("No reply type for cmd(" + unit.cmd + "). End connection.");
      client.socket.end();
      return;
    }
    if (unit.cmd !== cmdNotNeedLogin) {
      if (!client.hasLoggedIn) {
        client.send(new replyType(replyType.Result.NEED_LOGIN), unit.usn);
        return;
      }
    }
    reqType = rpc.cmdToType[unit.cmd];
    try {
      req = reqType.decode(unit.data);
    } catch (_error) {
      e = _error;
      req = new reqType;
      log.error({
        data: unit.data.toHex(true),
        req: req.toString(),
        e: e
      }, "Failed to parse message. End connection.");
      client.send(new replyType(replyType.Result.WRONG), unit.usn);
      return;
    }
    if (config.debug) {
      assert(req.usn == null);
    }
    req.usn = unit.usn;
    if (config.debug) {
      log.debug({
        cmd: req.toString(),
        conn: client.socket.connStr,
        data: req
      }, 'recv');
    }
    req.unitCommand = unit.cmd;
    req.replyType = replyType;
    return reqHandler(req);
  };
  return read(client.socket, data, unitHandler);
}

init();
module.exports = rpc;