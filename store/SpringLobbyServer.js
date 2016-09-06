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
var Team = require('util/Team.js');
var SystemInfo = require('util/SystemInfo.js');

module.exports = function(){ return Reflux.createStore({

	storeName: 'SpringLobbyServer',
	listenables: [Server, require('act/Chat.js'), require('../act/Battle.js')],
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
	sayPrivate: function(user, message, me){
		if (user in this.users)
			this.send((me ? 'SAYPRIVATEEX ' : 'SAYPRIVATE ') + user + ' ' + message);
		else if (user !== '')
			this.send('SAYPRIVATE Nightwatch !pm ' + user + ' ' + message);
	},
	sayBattle: function(message, me){
		if (this.currentBattle)
			this.send((me ? 'SAYBATTLEEX ' : 'SAYBATTLE ') + message);
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
	updateStatus: function(s){
		var mask = this.users[this.nick].statusMask || 0;
		if ('inGame' in s)
			mask = (s.inGame ? mask | 1 : mask & ~1);
		if ('away' in s)
			mask = (s.away ? mask | 2 : mask & ~2);
		this.send('MYSTATUS ' + mask);
	},
	joinMultiplayerBattle: function(id, password){
		if (this.currentBattle)
			this.leaveMultiplayerBattle();
		this.users[this.nick].scriptPassword = Math.round(Math.random()*1000000)+'';
		this.send(['JOINBATTLE', id, password || '', this.users[this.nick].scriptPassword].join(' '));
	},
	leaveMultiplayerBattle: function(){
		this.send('LEAVEBATTLE');
	},
	updateMultiplayerStatus: function(s){
		if (!this.currentBattle)
			return;
		var n = Team.getTeam(this.currentBattle.teams, this.nick);
		var ally = Math.max(n - 1, 0);
		var spectator = n === 0;
		_.defaults(s, {
			ready: !this.users[this.nick].away, // set ready bit to false if we're afk
			synced: this.users[this.nick].synced,
			team: this.users[this.nick].team,
			side: this.users[this.nick].side,
			color: this.users[this.nick].color,
			ally: ally,
			spectator: spectator,
		});
		var mask =
			(s.ready ? 2 : 0) |
			((s.synced ? 1 : 2) << 22) |
			(!s.spectator ? 1024 : 0) |
			(s.team << 2) |
			(s.ally << 6) |
			(s.side << 24);
		var colorInt = s.color[0] + (s.color[1] << 8) + (s.color[2] << 16);
		this.send('MYBATTLESTATUS ' + mask + ' ' + colorInt);
		if ('spectator' in s)
			this.specOnJoin = s.spectator;
	},

	addMultiplayerBot: function(bot){
		var s = 2 | (1 << 22) | 1024 | ((bot.team - 1) << 2) | ((bot.team - 1) << 6) | (bot.side << 24);
		var colorInt = bot.color[0] + (bot.color[1] << 8) + (bot.color[2] << 16);
		this.send(['ADDBOT', bot.name, s, colorInt, bot.type].join(' '));
	},
	removeMultiplayerBot: function(name){
		this.send('REMOVEBOT ' + name);
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
		var cpuCodes = {
			Windows: 7777,
			Linux: 7778,
			Linux64: 7778,
			Mac: 7779,
		}
		if (this.validateLoginPassword(Settings.name, Settings.password)){
			this.nick = Settings.name;
			this.send("LOGIN " + this.nick + ' ' + this.hashPassword(Settings.password) +
				' ' + cpuCodes[SystemInfo.platform || 'Windows'] + ' * SpringWebLobbyReactJS dev\t' +
				this.getUserID() + '\tcl sp p et');
		}
		this.triggerSync();
	},
	// Drop words from a server message.
	dropWords: function(str, n){
		for(var i = 0; i < n; i++)
			str = str.slice(str.indexOf(' ') + 1);
		return str;
	},
	updateBattleStatus: function(user, s, color){
		s = parseInt(s);
		var name = user.name;
		_.extend(user, {
			ready: (s & 2) > 0,
			synced: (s & (3 << 22)) >> 22 === 1,
			team: (s & (15 << 2)) >> 2,
			side: (s & (15 << 24)) >> 24,
			color: [color, color >> 8, color >> 16].map(function(x){ return x & 0xff; }),
		});
		var ally = (s & (15 << 6)) >> 6;
		var spec = (s & 1024) === 0;
		var teams = this.currentBattle.teams;
		var newTeam = spec ? 0 : ally + 1;
		var oldTeam = Team.getTeam(teams, name);
		if (newTeam !== oldTeam) {
			Team.remove(teams, name);
			Team.add(teams, user, newTeam);
		}
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
			s = parseInt(s);
			var newStatus = {
				admin: (s & 32) > 0,
				// lobbyBot is not the same as 'bot' used in battle context.
				lobbyBot: (s & 64) > 0,
				timeRank: (s & 28) >> 2,
				inGame: (s & 1) > 0,
				away: (s & 2) > 0,
				statusMask: s,
			};
			if (newStatus.away && !user.away)
				newStatus.awaySince = new Date();
			if (newStatus.inGame && !user.inGame)
				newStatus.inGameSince = new Date();
			if (name === this.nick && newStatus.away !== user.away)
				this.updateMultiplayerStatus({ ready: !newStatus.away });
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
			Chat.saidPrivate(name, this.dropWords(raw, 1), false);
			return true;
		},
		"SAIDPRIVATEEX": function(raw, name){
			Chat.saidPrivate(name, this.dropWords(raw, 1), true);
			return true;
		},
		// Confirmation that our private message was delivered.
		"SAYPRIVATE": function(raw, name){
			Chat.sentPrivate(name, this.dropWords(raw, 1), false);
			return true;
		},
		"SAYPRIVATEEX": function(raw, name){
			Chat.sentPrivate(name, this.dropWords(raw, 1), true);
			return true;
		},
		"SAIDBATTLE": function(raw, name){
			Chat.saidBattle(name, this.dropWords(raw, 1), false);
			return true;
		},
		"SAIDBATTLEEX": function(raw, name){
			Chat.saidBattle(name, this.dropWords(raw, 1), true);
			return true;
		},
		"RING": function(){
			Server.ringed();
			return true;
		},

		// BATTLES

		"BATTLEOPENED": function(raw, id, replay, natType, founder, ip, port, maxPlayers,
			passworded, rank, mapHash, engineName, engineVersion /* sentences: map, title, game */){

			var sentences = raw.split('\t');
			this.battles[id] = {
				id: id,
				title: sentences[3],
				engine: engineVersion,
				game: sentences[4],
				map: sentences[2],
				passworded: passworded === '1',
				maxPlayers: maxPlayers,
				founder: founder,
				spectatorCount: 0,
				ip: ip,
				port: port,
				teams: {},
				boxes: {},
				options: {},
			};
			Team.add(this.battles[id].teams, this.users[founder], 0);
		},
		"UPDATEBATTLEINFO": function(raw, id, spectatorCount, locked, mapHash){
			_.extend(this.battles[id], {
				spectatorCount: spectatorCount,
				locked: locked === '1',
				map: this.dropWords(raw, 4),
			});
		},
		"BATTLECLOSED": function(raw, id){
			if (this.currentBattle && id === this.currentBattle.id)
				this.handlers['LEFTBATTLE'].bind(this)('LEFTBATTLE ' + id + ' ' + this.nick, id, this.nick);
			delete this.battles[id];
		},
		"JOINEDBATTLE": function(raw, id, name, scriptPassword){
			this.users[name].scriptPassword = scriptPassword;
			Team.add(this.battles[id].teams, this.users[name], 1);
			this.users[name].battle = id;
			if (name === this.nick) {
				this.currentBattle = this.battles[id];
				if (this.specOnJoin)
					this.updateMultiplayerStatus({ spectator: true });
			}
		},
		"LEFTBATTLE": function(raw, id, name){
			Team.remove(this.battles[id].teams, name);
			delete this.users[name].battle;
			if (name === this.nick) {
				// Remove all bots so they don't linger forever.
				this.currentBattle.teams = _.mapValues(this.currentBattle.teams, function(team){
					return _.pick(team, function(u){ return !u.botType; });
				});
				this.currentBattle = null;
			}
		},
		"CLIENTBATTLESTATUS": function(raw, name, s, color){
			this.updateBattleStatus(this.users[name], s, color);
		},
		"ADDBOT": function(raw, battleId, name, owner, s, color, type){
			if (!this.currentBattle || this.currentBattle.id !== battleId)
				return true;
			this.updateBattleStatus({
				name: name,
				botType: type,
				botOwner: owner,
			}, s, color);
		},
		"UPDATEBOT": function(raw, battleId, name, s, color){
			if (!this.currentBattle || this.currentBattle.id !== battleId)
				return true;
			var team = Team.getTeam(this.currentBattle.teams, name);
			this.updateBattleStatus(this.currentBattle.teams[team][name], s, color);
		},
		"REMOVEBOT": function(raw, battleId, name){
			if (!this.currentBattle || this.currentBattle.id !== battleId)
				return true;
			Team.remove(this.currentBattle.teams, name);
		},
		"ADDSTARTRECT": function(raw, number, left, top, right, bottom){
			if (!this.currentBattle)
				return true;
			this.currentBattle.boxes[number] = {
				top: top / 200,
				left: left / 200,
				bottom: 1 - bottom / 200,
				right: 1 - right / 200,
			};
		},
		"REMOVESTARTRECT": function(raw, number){
			if (!this.currentBattle)
				return true;
			delete this.currentBattle.boxes[number];
		},
		"SETSCRIPTTAGS": function(raw){
			if (!this.currentBattle)
				return true;
			_.extend(this.currentBattle.options, raw.split('\t').reduce(function(acc, val){
				var match;
				var val = val.split('=');
				if (match = val[0].match(/game\/modoptions\/(\w+)/))
					acc[match[1]] = val[1];
				return acc;
			}, {}));
		},
	},
	message: function(msg){
		Settings.dumpNetwork && Log.debug("[IN] " + msg);
		var args = msg.split(/ |\t/);
		// Call the handler and trigger unless the handler returned true.
		if (this.handlers[args[0]] && !this.handlers[args[0]].apply(this, [this.dropWords(msg, 1)].concat(args.slice(1))))
			this.triggerSync();
	},
	send: function(msg){
		Settings.dumpNetwork && Log.debug("[OUT] " + msg);
		Server.sendRaw(msg);
	},
})};
