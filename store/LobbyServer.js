/*
 * Handles logic related to lobby server state, handles the protocol.
 *
 * This is the only module that knows about the lobby protocol.
 */

'use strict'

var Reflux = require('reflux');
var md5 = require('MD5');
var _ = require('lodash');
var Applet = require('./Applet.js');
var Settings = require('./Settings.js');
var setSetting = require('../act/Settings.js').set;
var Chat = require('../act/Chat.js');
var Log = require('../act/Log.js');

module.exports = Reflux.createStore({

	listenables: [require('../act/LobbyServer.js'), require('../act/Chat.js')],

	init: function(){
		_.extend(this, this.getClearState());
		_.extend(this, {
			connection: this.ConState.DISCONNECTED,
			registering: null,
			agreement: '', // if not empty, agreement to be accepted
			needNewLogin: false,
			lostPings: 0,
		});

		setInterval(this.pingPong.bind(this), 20000);

		// Set correct this in handlers.
		this.handlers = _.mapValues(this.handlers, function(f){ return f.bind(this); }, this);

		// Socket handlers for C++ API.
		window.on_socket_get = this.message.bind(this);
		window.on_socket_error = this.onError.bind(this);
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
			agreement: this.agreement,
			needNewLogin: this.needNewLogin,
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
		if (this.connection !== this.ConState.DISCONNECTED)
			this.disconnect();
		if (Applet) {
			var host = Settings.lobbyServer.split(':')[0] || 'lobby.springrts.com';
			var port = Settings.lobbyServer.split(':')[1] || '8200';
			Applet.connect(host, port);
		} else {
			this.socket = new WebSocket('ws://springrts.com:8260');
			this.socket.onmessage = _.compose(this.message, function(obj){ return obj.data; }).bind(this);
			this.socket.onerror = this.socket.onclose = this.onError.bind(this);
		}
		this.connection = this.ConState.CONNECTING;
		this.needNewLogin = false;
		this.triggerSync();
	},
	disconnect: function(){
		this.registering = null;
		this.send('EXIT');
		if (Applet) {
			Applet.disconnect();
			this.connection = this.ConState.DISCONNECTED;
			this.triggerSync();
		} else {
			this.socket.close();
		}
	},
	register: function(name, password, email){
		if (this.connection !== this.ConState.DISCONNECTED)
			this.disconnect();
		this.registering = { name: name, password: password, email: email };
		this.connect();
	},
	acceptAgreement: function(accept){
		if (accept){
			this.send('CONFIRMAGREEMENT');
			this.login();
		} else {
			this.disconnect();
		}
		this.agreement = '';
		this.triggerSync();
	},

	sayChannel: function(channel, message, me){
		if (channel in this.channels)
			this.send((me ? 'SAYEX ' : 'SAY ') + channel + ' ' + message);
	},
	sayPrivate: function(user, message){
		if (user in this.users)
			this.send('SAYPRIVATE ' + user + ' ' + message);
		else if (user !== '')
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

	pingPong: function(){
		if (this.lostPings > 4){
			this.lostPings = 0;
			Log.errorBox('Lost connection to server. Trying to reconnect...');
			this.disconnect();
			this.connect();
		} else if (this.connection === this.ConState.CONNECTED){
			this.send('PING');
			this.lostPings++;
		}
	},
	onError: function(){
		this.connection = this.ConState.DISCONNECTED;
		this.triggerSync();
	},
	hashPassword: function(password){
		return new Buffer(md5(password), 'hex').toString('base64');
	},
	getUserID: function(){
		var n = Applet && Applet.getUserID() || 0;
		// Return unsigned int32 even if the API returns signed.
		return n >= 0 ? n : 0xffffffff + 1 + n;
	},
	validateLoginPassword: function(login, password){
		var err = function(){
			this.needNewLogin = true;
			this.disconnect();
			this.triggerSync();
			return false;
		}.bind(this);
		if (login === ''){
			return err();
		} else if (password === ''){
			Log.errorBox('Password cannot be empty.');
			return err();
		} else if (login.match(/[^a-zA-Z0-9_\[\]]/)) {
			Log.errorBox('Login can only contain letters, digits, [, ] and _');
			return err();;
		}
		return true;
	},
	login: function(){
		if (this.validateLoginPassword(Settings.name, Settings.password)){
			this.nick = Settings.name;
			this.send("LOGIN " + this.nick + ' ' + this.hashPassword(Settings.password) +
				' 7778 * SpringWebLobbyReactJS 0.1\t' + this.getUserID() + '\tcl sp p et');
		}
		this.triggerSync();
	},
	// Drop words from a server message.
	dropWords: function(str, n){
		for(var i = 0; i < n; i++)
			str = str.slice(str.indexOf(' ') + 1);
		return str;
	},

	// Handlers for server commands. Unless you return true from a handler
	// triggerSync() will be called after it returns.
	handlers: {
		// LOGIN

		// Hi!
		"TASServer": function(){
			// Clear state in case we're reconnecting.
			_.extend(this, this.getClearState());
			if (this.registering){
				if (this.validateLoginPassword(this.registering.name, this.registering.password)){
					this.send('REGISTER ' + this.registering.name + ' ' + this.hashPassword(this.registering.password) +
						(this.registering.email ? ' ' + this.registering.email : ''));
				}
			} else {
				this.login();
			}
			return true;
		},
		"ACCEPTED": function(){
			this.connection = this.ConState.CONNECTED;
			this.send('JOIN asdf'); // XXX
			this.send('JOIN zk'); // XXX
			this.send('JOIN weblobbydev'); // XXX
		},
		"DENIED": function(args, data){
			Log.errorBox('Login denied: ' + data);
			this.needNewLogin = true;
			this.disconnect();
		},
		"REGISTRATIONACCEPTED": function(){
			setSetting('name', this.registering.name);
			setSetting('password', this.registering.password);
			this.disconnect();
			this.connect();
			return true;
		},
		"REGISTRATIONDENIED": function(args, data){
			Log.errorBox('Registration denied: ' + data);
			this.needNewLogin = true;
			this.disconnect();
		},
		"AGREEMENT": function(args, data){
			this.agreement += (data + '\n');
		},
		"PONG": function(){
			this.lostPings = 0;
			return true;
		},
		"REDIRECT": function(args){
			if (Applet) {
				Applet.disconnect();
				Applet.connect(args[0], args[1]);
			}
		},

		// USER STATUS

		"ADDUSER": function(args){
			this.users[args[0]] = { name: args[0], country: (args[1] === '??' ? 'unknown' : args[1]), cpu: args[2] };
		},
		"CLIENTSTATUS": function(args){
			if(!this.users[args[0]]) return true;
			var user = this.users[args[0]];
			var s = parseInt(args[1]);
			var newStatus = {
				admin: (s & 32) > 0,
				// lobbyBot is not the same as 'bot' used in battle context.
				lobbyBot: (s & 64) > 0,
				timeRank: (s & 28) >> 2,
				inGame: (s & 1) > 0,
				away: (s & 2) > 0,
			};
			if (newStatus.away && !user.away)
				newStatus.awaySince = new Date();
			if (newStatus.inGame && !user.inGame)
				newStatus.inGameSince = new Date();
			_.extend(this.users[args[0]], newStatus);
		},

		// CHANNELS

		// We joined a channel.
		"JOIN": function(args){
			this.channels[args[0]] = { name: args[0], users: {} };
		},
		"CHANNELTOPIC": function(args, data){
			this.channels[args[0]].topic = {
				text: this.dropWords(data, 3),
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
		"SAID": function(args, data){
			Chat.saidChannel(args[0], args[1], this.dropWords(data, 2), false);
			return true;
		},
		"SAIDEX": function(args, data){
			Chat.saidChannel(args[0], args[1], this.dropWords(data, 2), true);
			return true;
		},
		"SAIDPRIVATE": function(args, data){
			Chat.saidPrivate(args[0], this.dropWords(data, 1));
			return true;
		},
	},
	message: function(msg){
		///console.log("[IN] " + msg);
		var args = msg.split(' ');
		// Call the handler and trigger unless the handler returned true.
		if (this.handlers[args[0]] && !this.handlers[args[0]](args.slice(1), this.dropWords(msg, 1)))
			this.triggerSync();
	},
	send: function(msg){
		//console.log("[OUT] " + msg);
		Applet ? Applet.send(msg + '\n') : this.socket.send(msg);
	},
});
