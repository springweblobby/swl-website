/*
 * Handles logic related to lobby server state, handles the protocol.
 *
 * This is the only module that knows about the lobby protocol.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');
var Applet = require('store/Applet.js');
var Settings = require('store/Settings.js');
var setSetting = require('act/Settings.js').set;
var Server = require('act/LobbyServer.js');
var Chat = require('act/Chat.js');
var Log = require('act/Log.js');

var storePrototype = {

	listenables: [Server, require('act/Chat.js')],
	mixins: [require('store/LobbyServerCommon.js')],

	init: function(){
		this.lostPings = 0;
		this.pingInterval = setInterval(this.pingPong, 20000);
	},
	dispose: function(){
		clearInterval(this.pingInterval);
		this.stopListeningToAll();
	},

	// We throttle this to avoid slowdowns due to excessive retriggering
	// (e.g. on login when the server sends a ton of ADDUSER messages).
	triggerSync: _.throttle(function(){
		this.trigger(this.getInitialState());
	}, 100),

	// Action listeners.

	acceptAgreement: function(accept){
		if (accept){
			this.send('CONFIRMAGREEMENT');
			this.login();
		} else {
			Server.disconnect();
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
			Server.disconnect();
			Server.connect();
		} else if (this.connection === this.ConnectionState.CONNECTED){
			this.send('PING');
			this.lostPings++;
		}
	},
	login: function(){
		if (this.validateLoginPassword(Settings.name, Settings.password)){
			this.nick = Settings.name;
			this.send("LOGIN " + this.nick + ' ' + this.hashPassword(Settings.password) +
				' 7778 * SpringWebLobbyReactJS dev\t' + this.getUserID() + '\tcl sp p et');
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
			this.connection = this.ConnectionState.CONNECTED;
			this.autoJoinChannels();
		},
		"DENIED": function(reason){
			Log.errorBox('Login denied: ' + reason);
			this.needNewLogin = true;
			Server.disconnect();
		},
		"REGISTRATIONACCEPTED": function(){
			setSetting('name', this.registering.name);
			setSetting('password', this.registering.password);
			Server.disconnect();
			Server.connect();
			return true;
		},
		"REGISTRATIONDENIED": function(reason){
			Log.errorBox('Registration denied: ' + reason);
			this.needNewLogin = true;
			Server.disconnect();
		},
		"AGREEMENT": function(line){
			this.agreement += (line + '\n');
		},
		"PONG": function(){
			this.lostPings = 0;
			return true;
		},
		"REDIRECT": function(raw, host, port){
			if (Applet) {
				Applet.disconnect();
				Applet.connect(host, port);
			}
		},

		// USER STATUS

		"ADDUSER": function(raw, name, country, cpu){
			var user = {
				name: name,
				country: (country === '??' ? 'unknown' : country),
			};

			if ( _.indexOf( ['7777', '7778', '7779'], cpu ) !== -1)
				user.lobby = 'swl';
			else if ( _.indexOf( ['6666', '6667', '6668'], cpu ) !== -1 )
				user.lobby = 'zkl';
			else if ( _.indexOf( ['9997', '9998', '9999'], cpu ) !== -1 )
				user.lobby = 'notalobby';
			else if ( _.indexOf( ['8484'], cpu ) !== -1 )
				user.lobby = 'mlclient';
			else if ( _.indexOf( ['4607052', '4607063', '4607053'], cpu ) !== -1 )
				user.lobby = 'flobby';

			// OS
			if ( _.indexOf([ '7777', '9998', '6667', '4607063' ], cpu) !== -1 )
				user.os = 'windows';
			else if ( _.indexOf([ '7778', '9999', '6668', '4607052' ], cpu) !== -1 )
				user.os = 'linux';
			else if ( _.indexOf([ '7779', '9997', '4607053' ], cpu) !== -1 )
				user.os = 'mac';

			this.users[user.name] = user;
		},
		"CLIENTSTATUS": function(raw, name, s){
			if(!this.users[name]) return true;
			var user = this.users[name];
			var s = parseInt(s);
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
			_.extend(this.users[name], newStatus);
		},

		// CHANNELS

		// We joined a channel.
		"JOIN": function(raw, channel){
			this.channels[channel] = { name: channel, users: {} };
		},
		"CHANNELTOPIC": function(raw, channel, author, timestamp){
			this.channels[channel].topic = {
				text: this.dropWords(raw, 3),
				author: author,
				time: new Date(parseInt(timestamp) * 1000)
			};
		},
		"NOCHANNELTOPIC": function(raw, channel){
			this.channels[channel].topic = null;
		},
		// List of people in a channel.
		"CLIENTS": function(raw, channel){
			var args = Array.prototype.slice.call(arguments);
			args.slice(2).forEach(function(name){
				if (name in this.users) // uberserver can report stale users
					this.channels[channel].users[name] = this.users[name];
			}.bind(this));
		},
		// Someone joined a channel.
		"JOINED": function(raw, channel, name){
			this.channels[channel].users[name] = this.users[name];
		},
		// Someone left a channel.
		"LEFT": function(raw, channel, name){
			delete this.channels[channel].users[name];
		},
		// Someone got kicked. Maybe us.
		"FORCELEAVECHANNEL": function(raw, channel, name){
			delete this.channels[channel].users[name];
		},

		// TEXT MESSAGES

		// Someone said something in a channel.
		"SAID": function(raw, channel, author){
			Chat.saidChannel(channel, author, this.dropWords(raw, 2), false);
			return true;
		},
		"SAIDEX": function(raw, channel, author){
			Chat.saidChannel(channel, author, this.dropWords(raw, 2), true);
			return true;
		},
		"SAIDPRIVATE": function(raw, name){
			Chat.saidPrivate(name, this.dropWords(raw, 1));
			return true;
		},
		// Confirmation that our private message was delivered.
		"SAYPRIVATE": function(raw, name){
			Chat.sentPrivate(name, this.dropWords(raw, 1));
			return true;
		},
	},
	message: function(msg){
		///console.log("[IN] " + msg);
		var args = msg.split(' ');
		// Call the handler and trigger unless the handler returned true.
		if (this.handlers[args[0]] && !this.handlers[args[0]].apply(this, [this.dropWords(msg, 1)].concat(args.slice(1))))
			this.triggerSync();
	},
	send: function(msg){
		//console.log("[OUT] " + msg);
		Applet ? Applet.send(msg + '\n') : this.socket.send(msg);
	},
};

module.exports = _.partial(Reflux.createStore, storePrototype);
