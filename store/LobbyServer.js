/*
 * Handles logic related to lobby server state, handles the protocol.
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
		// Public state that gets distributed to components.
		this.state = {
			connection: this.ConState.DISCONNECTED,
			nick: Settings.name,
			users: {},
			channels: {},
		};

		// Make common things accessable trough this directly. That means you
		// must never assign to them!
		this.users = this.state.users;
		this.channels = this.state.channels;

		setInterval(function(){
			if (this.state.connection === this.ConState.CONNECTED)
				this.send('PING');
		}.bind(this), 20000);

		// Set correct this in handlers.
		this.handlers = _.mapValues(this.handlers, function(f){ return f.bind(this); }, this);
	},
	getDefaultData: function(){ return this.state; },

	// We throttle this to avoid slowdowns due to excessive retriggering
	// (e.g. on login when the server sends a ton of ADDUSER messages).
	triggerSync: _.throttle(function(){
		this.trigger(this.state);
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
			this.state.connection = this.ConState.DISCONNECTED;
			this.triggerSync();
		}.bind(this);
		this.state.connection = this.ConState.CONNECTING;
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

	// Not action listeners.

	login: function(){
		this.state.nick = Settings.name;
		this.send("LOGIN " + this.state.nick + ' ' + Buffer(md5(Settings.password), 'hex').toString('base64') + ' 7778 * SpringWebLobbyReactJS 0.1\t4236959782\tcl sp p et');
		this.triggerSync();
	},
	handlers: {
		// LOGIN

		// Hi!
		"TASServer": function(){
			this.login();
		},
		"ACCEPTED": function(args){
			this.state.connection = this.ConState.CONNECTED;
			this.send('JOIN asdf'); // XXX
			this.triggerSync();
		},
		"DENIED": function(args){
			this.socket.close();
			this.state.connection = this.ConState.DISCONNECTED;
			this.triggerSync();
		},

		// USER STATUS

		"ADDUSER": function(args){
			this.users[args[0]] = { name: args[0], country: args[1], cpu: args[2] };
			this.triggerSync();
		},

		// CHANNELS

		// We joined a channel.
		"JOIN": function(args){
			this.channels[args[0]] = { name: args[0], users: {} };
			this.triggerSync();
		},
		"CHANNELTOPIC": function(args){
			this.channels[args[0]].topic = args.slice(3).join(' ');
			this.channels[args[0]].topicAuthor = args[1];
			this.channels[args[0]].topicTime = new Date(parseInt(args[2]) * 1000);
			this.triggerSync();
		},
		"NOCHANNELTOPIC": function(args){
			this.channels[args[0]].topic = '';
			this.triggerSync();
		},
		// List of people in a channel.
		"CLIENTS": function(args){
			args.slice(1).forEach(function(name){
				this.channels[args[0]].users[name] = this.users[name];
			}.bind(this));
			this.triggerSync();
		},
		// Someone joined a channel.
		"JOINED": function(args){
			this.channels[args[0]].users[args[1]] = this.users[args[1]];
			this.triggerSync();
		},
		// Someone left a channel.
		"LEFT": function(args){
			delete this.channels[args[0]].users[args[1]];
			this.triggerSync();
		},
		// Someone got kicked. Maybe us.
		"FORCELEAVECHANNEL": function(args){
			delete this.channels[args[0]].users[args[1]];
			this.triggerSync();
		},

		// TEXT MESSAGES

		// Someone said something in a channel.
		"SAID": function(args){
			Chat.saidChannel(args[0], args[1], args.slice(2).join(' '), false);
		},
		"SAIDEX": function(args){
			Chat.saidChannel(args[0], args[1], args.slice(2).join(' '), true);
		},
		"SAIDPRIVATE": function(args){
			Chat.saidPrivate(args[0], args.slice(1).join(' '));
		},
	},
	message: function(msg){
		//console.log("[IN] " + msg.data);
		var args = msg.data.split(' ');
		if (this.handlers[args[0]])
			this.handlers[args[0]](args.slice(1), msg.data);
	},
	send: function(msg){
		//console.log("[OUT] " + msg);
		this.socket.send(msg);
	},
});
