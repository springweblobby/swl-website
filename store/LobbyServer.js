/*
 * Handles logic related to lobby server state, handles the protocol.
 */

'use strict'

var Reflux = require('reflux');
var md5 = require('MD5');
var _ = require('lodash');
var Settings = require('./Settings.js');

module.exports = Reflux.createStore({

	listenables: require('../act/LobbyServer.js'),

	init: function(){
		this.state = {
			connection: this.ConState.DISCONNECTED,
			nick: Settings.name,
			users: {},
		};

		setInterval(function(){
			if (this.state.connection === this.ConState.CONNECTED)
				this.send('PING');
		}.bind(this), 20000);

		// Set correct this in handlers.
		this.handlers = _.mapValues(this.handlers, function(f){ return f.bind(this); }, this);
	},
	getDefaultData: function(){ return this.state; },
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

	// Not action listeners.

	login: function(){
		this.state.nick = Settings.name;
		this.send("LOGIN " + this.state.nick + ' ' + Buffer(md5(Settings.password), 'hex').toString('base64') + ' 7778 * SpringWebLobbyReactJS 0.1\t4236959782\tcl sp p');
		this.triggerSync();
	},
	handlers: {
		"TASServer": function(){
			this.login();
		},
		"ACCEPTED": function(args){
			this.state.connection = this.ConState.CONNECTED;
			this.triggerSync();
		},
		"DENIED": function(args){
			this.socket.close();
			this.state.connection = this.ConState.DISCONNECTED;
			this.triggerSync();
		},
		"ADDUSER": function(args){
			this.state.users[args[0]] = { name: args[0], country: args[1], cpu: args[2] };
			this.triggerSync();
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
