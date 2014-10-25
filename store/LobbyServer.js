/*
 * Handles logic related to lobby server state, handles the protocol.
 *
 * This is the only module that knows about the lobby protocol.
 */

'use strict'

var Reflux = require('reflux');
var md5 = require('MD5');
var _ = require('lodash');
var Settings = require('./Settings.js');
var Chat = require('../act/Chat.js');

module.exports = Reflux.createStore({

	listenables: [require('../act/LobbyServer.js'), require('../act/Chat.js')],

	init: function(){
		_.extend(this, this.getClearState());
		this.connection = this.ConState.DISCONNECTED;

		setInterval(function(){
			if (this.connection === this.ConState.CONNECTED)
				this.send('PING');
		}.bind(this), 20000);

		// Set correct this in handlers.
		this.handlers = _.mapValues(this.handlers, function(f){ return f.bind(this); }, this);
	},
	getClearState: function(){
		return {
			nick: Settings.name,
			users: {},
			channels: {},
		};
	},
	getDefaultData: function(){
		return {
			connection: this.connection,
			nick: this.nick,
			users: this.users,
			channels: this.channels,
		};
	},

	// We throttle this to avoid slowdowns due to excessive retriggering
	// (e.g. on login when the server sends a ton of ADDUSER messages).
	triggerSync: _.throttle(function(){
		this.trigger(this.getDefaultData());
	}, 100),

	ConState: {
		DISCONNECTED: 0,
		CONNECTING: 1,
		CONNECTED: 2
	},

	// Action listeners.

	connect: function(){
		this.socket = new WebSocket('ws://localhost:8260');
		this.socket.onmessage = this.message.bind(this);
		this.socket.onerror = this.socket.onclose = function(){
			this.connection = this.ConState.DISCONNECTED;
			this.triggerSync();
		}.bind(this);
		this.connection = this.ConState.CONNECTING;
		this.triggerSync();
	},
	disconnect: function(){
		this.socket.close();
	},
	sayChannel: function(channel, message, me){
		this.send((me ? 'SAYEX ' : 'SAY ') + channel + ' ' + message);
	},
	sayPrivate: function(user, message){
		if (user in this.users)
			this.send('SAYPRIVATE ' + message);
		else
			this.send('SAYPRIVATE Nightwatch !pm ' + user + ' ' + message);
	},
	joinChannel: function(channel, password){
		if (!(channel in this.channels))
			this.send('JOIN ' + channel + (password ? ' ' + password : ''));
	},
	leaveChannel: function(channel){
		if (channel in this.channels){
			this.send('LEAVE ' + channel);
			delete this.channels[channel];
			this.triggerSync();
		}
	},

	// Not action listeners.

	login: function(){
		this.nick = Settings.name;
		this.send("LOGIN " + this.nick + ' ' + Buffer(md5(Settings.password), 'hex').toString('base64') + ' 7778 * SpringWebLobbyReactJS 0.1\t4236959782\tcl sp p et');
		this.triggerSync();
	},

	// Handlers for server commands. Unless you return true from a handler
	// triggerSync() will be called after it returns.
	handlers: {
		// LOGIN

		// Hi!
		"TASServer": function(){
			// Clear state in case we're reconnecting.
			_.extend(this, this.getClearState());
			this.login();
			return true;
		},
		"ACCEPTED": function(args){
			this.connection = this.ConState.CONNECTED;
			this.send('JOIN asdf'); // XXX
			this.send('JOIN zk'); // XXX
			this.send('JOIN weblobbydev'); // XXX
		},
		"DENIED": function(args){
			this.socket.close();
			this.connection = this.ConState.DISCONNECTED;
		},

		// USER STATUS

		"ADDUSER": function(args){
			this.users[args[0]] = { name: args[0], country: (args[1] === '??' ? 'unknown' : args[1]), cpu: args[2] };
		},

		// CHANNELS

		// We joined a channel.
		"JOIN": function(args){
			this.channels[args[0]] = { name: args[0], users: {} };
		},
		"CHANNELTOPIC": function(args){
			this.channels[args[0]].topic = {
				text: args.slice(3).join(' '),
				author: args[1],
				time: new Date(parseInt(args[2]) * 1000)
			};
		},
		"NOCHANNELTOPIC": function(args){
			this.channels[args[0]].topic = null;
		},
		// List of people in a channel.
		"CLIENTS": function(args){
			args.slice(1).forEach(function(name){
				if (name in this.users) // uberserver can report stale users
					this.channels[args[0]].users[name] = this.users[name];
			}.bind(this));
		},
		// Someone joined a channel.
		"JOINED": function(args){
			this.channels[args[0]].users[args[1]] = this.users[args[1]];
		},
		// Someone left a channel.
		"LEFT": function(args){
			delete this.channels[args[0]].users[args[1]];
		},
		// Someone got kicked. Maybe us.
		"FORCELEAVECHANNEL": function(args){
			delete this.channels[args[0]].users[args[1]];
		},

		// TEXT MESSAGES

		// Someone said something in a channel.
		"SAID": function(args){
			Chat.saidChannel(args[0], args[1], args.slice(2).join(' '), false);
			return true;
		},
		"SAIDEX": function(args){
			Chat.saidChannel(args[0], args[1], args.slice(2).join(' '), true);
			return true;
		},
		"SAIDPRIVATE": function(args){
			Chat.saidPrivate(args[0], args.slice(1).join(' '));
			return true;
		},
	},
	message: function(msg){
		//console.log("[IN] " + msg.data);
		var args = msg.data.split(' ');
		// Call the handler and trigger unless the handler returned true.
		if (this.handlers[args[0]] && !this.handlers[args[0]](args.slice(1), msg.data))
			this.triggerSync();
	},
	send: function(msg){
		//console.log("[OUT] " + msg);
		this.socket.send(msg);
	},
});
