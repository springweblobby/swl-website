/*
 * Handles logic related to lobby server state, handles the protocol.
 *
 * This is the only module that knows about the lobby protocol.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('./Applet.js');
var Settings = require('./Settings.js');
var setSetting = require('../act/Settings.js').set;
var Server = require('../act/LobbyServer.js');
var Chat = require('../act/Chat.js');
var Log = require('../act/Log.js');

var LoginResponse = {
	Ok: 0,
	AlreadyConnected: 1,
	InvalidName: 2,
	InvalidPassword: 3,
	Banned: 4,
};
var SayPlace = {
	Channel: 0,
	Battle: 1,
	User: 2,
	BattlePrivate: 3,
	Game: 4,
	MessageBox: 5,
};

var storePrototype = {

	listenables: [Server, require('../act/Chat.js'), require('../act/Battle.js')],
	mixins: [require('./LobbyServerCommon.js')],

	init: function(){
		this.lostPings = 0;
		this.pingInterval = setInterval(this.pingPong.bind(this), 30000);

		// Set correct this in handlers.
		this.handlers = _.mapValues(this.handlers, function(f){ return f.bind(this); }, this);
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

	sayChannel: function(channel, message, me){
		if (channel in this.channels) {
			this.send('Say', {
				Place: SayPlace.Channel,
				Target: channel,
				User: this.nick,
				IsEmote: me,
				Text: message,
				Ring: false,
			});
		}
	},
	sayPrivate: function(user, message){
		if (user in this.users) {
			this.send('Say', {
				Place: SayPlace.User,
				Target: user,
				User: this.nick,
				Text: message,
				Ring: false,
			});
		} else {
			this.send('Say', {
				Place: SayPlace.User,
				Target: 'Nightwatch',
				User: this.nick,
				Text: '!pm ' + user + ' ' + message,
				Ring: false,
			});
		}
	},
	joinChannel: function(channel, password){
		if (!(channel in this.channels))
			this.send('JoinChannel', { ChannelName: channel, Password: password || null });
	},
	leaveChannel: function(channel){
		if (channel in this.channels){
			this.send('LeaveChannel', { ChannelName: channel });
			delete this.channels[channel];
			this.triggerSync();
		}
	},
	joinMultiplayerBattle: function(id, password){
		this.send('JoinBattle', { BattleID: id, Password: password || null });
	},
	leaveMultiplayerBattle: function(){
		this.send('LeaveBattle', { BattleID: this.currentBattle && this.currentBattle.id });
	},

	// Not action listeners.

	pingPong: function(){
		if (this.lostPings > 4){
			this.lostPings = 0;
			Log.errorBox('Lost connection to server. Trying to reconnect...');
			Server.disconnect();
			Server.connect();
		} else if (this.connection === this.ConnectionState.CONNECTED){
			this.send('Ping', {});
			this.lostPings++;
		}
	},
	login: function(){
		if (this.validateLoginPassword(Settings.name, Settings.password)){
			this.nick = Settings.name;
			this.send('Login', {
				Name: this.nick,
				PasswordHash: this.hashPassword(Settings.password),
				UserID: this.getUserID(),
				LobbyVersion: "SpringWebLobbyReactJS dev",
				ClientType: 2,
			});
		}
		this.triggerSync();
	},
	loginResponseToText: function(code){
		return {
			0: 'Ok',
			1: 'Already connected',
			2: 'Invalid name',
			3: 'Invalid password',
			4: 'Banned',
		}[code];
	},

	// Handlers for server commands. Unless you return true from a handler
	// triggerSync() will be called after it returns.
	handlers: {
		// LOGIN

		// Hi!
		"Welcome": function(){
			if (this.registering){
				if (this.validateLoginPassword(this.registering.name, this.registering.password)){
					this.send('Register', {
						Name: this.registering.name,
						PasswordHash: this.hashPassword(this.registering.password)
					});
				}
			} else {
				this.login();
			}
			return true;
		},
		"LoginResponse": function(msg){
			if (msg.ResultCode === LoginResponse.Ok) {
				this.connection = this.ConnectionState.CONNECTED;
				this.autoJoinChannels();
			} else {
				Log.errorBox('Login denied: ' + this.loginResponseToText(msg.ResultCode) +
					(msg.Reason ? '\n' + msg.Reason : ''));
				this.needNewLogin = true;
				Server.disconnect();
			}
		},
		"RegisterResponse": function(msg){
			if (msg.ResultCode === LoginResponse.Ok) {
				setSetting('name', this.registering.name);
				setSetting('password', this.registering.password);
				Server.disconnect();
				Server.connect();
			} else {
				Log.errorBox('Registration denied: ' + this.loginResponseToText(msg.ResultCode) +
					(msg.Reason ? '\n' + msg.Reason : ''));
				this.needNewLogin = true;
				Server.disconnect();
			}
			return true;
		},
		"Ping": function(){
			this.lostPings = 0;
			return true;
		},

		// USER STATUS

		"User": function(user){
			var newUser = {
				name: user.Name,
				country: user.Country,
				admin: user.IsAdmin,
				lobbyBot: user.IsBot,
				inGame: user.IsInGame,
				away: user.IsAway,
			};
			if (this.users[user.Name]) {
				if (newUser.away && !user.away)
					newUser.awaySince = new Date();
				if (newUser.inGame && !user.inGame)
					newUser.inGameSince = new Date();
				_.extend(this.users[user.Name], newUser);
			} else {
				this.users[user.Name] = newUser;
			}
		},
		"UserDisconnected": function(msg){
			if (msg.Name in this.users)
				delete this.users[msg.Name];
			else
				return true;
		},

		// CHANNELS

		"JoinChannelResponse": function(msg){
			if (msg.Success) {
				this.channels[msg.ChannelName] = { name: msg.ChannelName, users: {} };
			} else {
				Log.errorBox('Couldn\'t join channel ' + msg.ChannelName + ': ' +
					msg.Reason);
				return true;
			}
			_.extend(this.channels[msg.ChannelName].users, _.map(msg.Channel.Users, function(name){
				return this.users[name];
			}.bind(this)));
			if (msg.Channel.Topic) {
				this.channels[msg.ChannelName].topic = {
					text: msg.Channel.Topic,
					author: msg.Channel.TopicSetBy,
					time: new Date(), // XXX new Date(parseInt(args[2]) * 1000)
				};
			} else {
				this.channels[msg.ChannelName].topic = null;
			}
		},
		"ChannelUserAdded": function(msg){
			this.channels[msg.ChannelName].users[msg.UserName] = this.users[msg.UserName];
		},
		"ChannelUserRemoved": function(msg){
			delete this.channels[msg.ChannelName].users[msg.UserName];
		},

		// TEXT MESSAGES

		"Say": function(msg){
			if (msg.Place === SayPlace.Channel)
				Chat.saidChannel(msg.Target, msg.User, msg.Text, msg.IsEmote);
			else if (msg.Place === SayPlace.User && msg.User === this.nick)
				Chat.sentPrivate(msg.Target, msg.Text, msg.IsEmote);
			else if (msg.Place === SayPlace.User)
				Chat.saidPrivate(msg.User, msg.Text, msg.IsEmote);
			return true;
		},

		// BATTLES

		"BattleAdded": function(msg){
			this.handlers.BattleUpdate(msg);
		},
		"BattleUpdate": function(msg){
			var battle = msg.Header;
			if (!this.battles[battle.BattleID])
				this.battles[battle.BattleID] = { teams: { 0: {} } };
			// The call to _.defaults() is used so that we don't overwrite the
			// original battle properties with undefined.
			_.extend(this.battles[battle.BattleID], _.defaults({
				id: battle.BattleID,
				title: battle.Title,
				engine: battle.Engine,
				game: battle.Game,
				map: battle.Map,
				// Apparently, the string "?" means it's passworded.
				passworded: !!battle.Password,
				maxPlayers: battle.MaxPlayers,
				spectatorCount: battle.SpectatorCount,
				founder: battle.Founder,
				ip: battle.Ip,
				port: battle.Port,
			}, this.battles[battle.BattleID]));
		},
		"BattleRemoved": function(msg){
			delete this.battles[msg.BattleID];
		},
		"JoinedBattle": function(msg){
			this.battles[msg.BattleID].teams[0][msg.User] = this.users[msg.User];
			if (msg.User === this.nick)
				this.currentBattle = this.battles[msg.BattleID];
		},
		"LeftBattle": function(msg){
			_(this.battles[msg.BattleID].teams).forEach(function(team){
				delete team[msg.User];
			});
			if (msg.User === this.nick)
				this.currentBattle = null;
		},
		"UpdateUserBattleStatus": function(msg){
			if (!this.currentBattle)
				return true;
			_.extend(this.users[msg.Name], _.defaults({
				synced: msg.Sync === 1,
				team: msg.TeamNumber,
				side: 0, // No protocol support yet.
				bot: !!msg.AiLib,
				botType: msg.AiLib,
				botOwner: msg.Owner,
			}, this.users[msg.Name]));
			_(this.currentBattle.teams).forEach(function(team){
					delete team[msg.Name];
			});
			this.currentBattle.teams[msg.IsSpectator ? 0 :
				msg.AllyNumber + 1][msg.Name] = this.users[msg.Name];
		},
		"UpdateBotStatus": function(msg){
			return this.handlers.UpdateUserBattleStatus(msg);
		},
		"RemoveBot": function(msg){
			this.handlers.LeftBattle({ BattleID: this.currentBattle.id, User: msg.Name });
		},
	},
	message: function(data){
		console.log("[IN] " + data);
		var n = data.search(' ');
		var message = data.slice(0, n);
		var payload = JSON.parse(data.slice(n + 1));
		// Call the handler and trigger unless the handler returned true.
		if (this.handlers[message] && !this.handlers[message](payload))
			this.triggerSync();
	},
	send: function(message, payload){
		var str = message + ' ' + JSON.stringify(payload);
		console.log("[OUT] " + str);
		Applet ? Applet.send(str + '\n') : this.socket.send(str);
	},
};

module.exports = _.partial(Reflux.createStore, storePrototype);
