/*
 * Handles logic related to lobby server state, handles the protocol.
 *
 * This is the only module that knows about the lobby protocol.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('store/Applet.js');
var Settings = require('store/Settings.js');
var setSetting = require('act/Settings.js').set;
var Server = require('act/LobbyServer.js');
var Chat = require('act/Chat.js');
var Log = require('act/Log.js');
var Team = require('util/Team.js');
var Process = require('act/Process.js');
var Sound = require('act/Sound.js');

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

// This works the same as _.extend() except it ignores properties that are
// undefined in the source object.
function extendUpdate(dest, src) {
	_.extend(dest, _.omit(src, function(p){
		return p === undefined;
	}));
}

module.exports = function(){ return Reflux.createStore({

	storeName: 'ZkLobbyServer',
	listenables: [Server, require('act/Chat.js'), require('../act/Battle.js')],
	mixins: [require('store/LobbyServerCommon.js')],

	init: function(){
		// Set correct this in handlers.
		this.handlers = _.mapValues(this.handlers, function(f){ return f.bind(this); }, this);
	},
	
	dispose: function(){
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
	sayPrivate: function(user, message, me){
		this.send('Say', {
			Place: SayPlace.User,
			Target: user,
			User: this.nick,
			IsEmote: me,
			Text: message,
			Ring: false,
		});
	},
	sayBattle: function(message, me){
		if (this.currentBattle) {
			this.send('Say', {
				Place: SayPlace.Battle,
				User: this.nick,
				IsEmote: me,
				Text: message,
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
	updateStatus: function(s){
		this.send('ChangeUserStatus', {
			IsInGame: s.inGame,
			IsAfk: s.away,
		});
	},
	joinMultiplayerBattle: function(id, password){
		if (this.currentBattle)
			this.leaveMultiplayerBattle();
		this.send('JoinBattle', { BattleID: id, Password: password || null });
	},
	createMultiplayerBattle: function(mode, name, password){
		if (this.currentBattle)
			this.leaveMultiplayerBattle();
		this.send('OpenBattle', {"Header":{"Mode":mode,"Password":password || '',"Title":name}});
	},
	leaveMultiplayerBattle: function(){
		this.send('LeaveBattle', { BattleID: this.currentBattle && this.currentBattle.id });
	},
	updateMultiplayerStatus: function(s){
		this.send('UpdateUserBattleStatus', {
			Name: this.nick,
			AllyNumber: s.ally,
			IsSpectator: s.spectator,
			Sync: ('synced' in s ? (s.synced ? 1 : 2) : undefined),
		});
		if ('spectator' in s)
			this.specOnJoin = s.spectator;
	},

	addMultiplayerBot: function(bot){
		this.send('UpdateBotStatus', {
			AllyNumber: bot.team - 1,
			Name: bot.name,
			AiLib: bot.type,
			Owner: this.nick,
		});
	},
	removeMultiplayerBot: function(name){
		this.send('RemoveBot', { Name: name });
	},
	requestConnectSpring: function(battleId){
		this.sentLaunchRequest = true;
		this.send('RequestConnectSpring', { BattleID: battleId });
	},
	requestMatchmaking: function(queues){
		this.send('MatchMakerQueueRequest', { Queues: queues });
	},
	acceptMatch: function(ready){
		this.send('AreYouReadyResponse', {"Ready" : ready});
		this.awaitingAccept = false;
		this.triggerSync();
	},

	// Not action listeners.

	login: function(){
		if (this.validateLoginPassword(Settings.name, Settings.password)){
			this.nick = Settings.name;
			this.send('Login', {
				Name: this.nick,
				PasswordHash: this.hashPassword(Settings.password),
				UserID: this.getUserID(),
				LobbyVersion: "Spring Web Lobby react dev",
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
	getOrCreateUser: function(name){
		if (!this.users[name])
			this.users[name] = { name: name };
		return this.users[name];
	},

	// Handlers for server commands. Unless you return true from a handler
	// triggerSync() will be called after it returns.
	handlers: {
		// LOGIN

		// Hi!
		"Welcome": function(msg){
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
			var zklsVersion = msg.Version;
			if (msg.Engine){
				var engine = msg.Engine;
				engine.match(/^[0-9.]+-[0-9]+-g[a-f0-9]+$/) && (engine += ' develop');
				Process.downloadEngine(engine);
			}
			msg.Game && Process.downloadGame(msg.Game);
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

		// USER STATUS

		"User": function(user){
			var newUser = {
				name: user.Name,
				country: user.Country,
				clan: user.Clan,
				admin: user.IsAdmin,
				lobbyBot: user.IsBot,
				inGame: user.IsInGame,
				inGameSince: user.InGameSince && new Date(user.InGameSince),
				away: user.IsAway,
				awaySince: user.AwaySince && new Date(user.AwaySince),
				lobbyVersion: user.LobbyVersion || '',
				elo: user.EffectiveMmElo || 0,
				level: user.Level || 0,
				battleId: user.BattleID || null,
			};
			var oldBattleId = this.users[user.Name] && this.users[user.Name].battleId;

			if (newUser.lobbyVersion.match(/Spring Web Lobby/))
				newUser.lobby = 'swl';
			else if (newUser.lobbyVersion.match(/flobby/))
				newUser.lobby = 'flobby';
			else if (newUser.lobbyVersion.match(/Chobby/))
				newUser.lobby = 'chobby';

			if (this.users[user.Name])
				extendUpdate(this.users[user.Name], newUser);
			else
				this.users[user.Name] = newUser;

			if (user.BattleID !== oldBattleId) {
				if (user.BattleID == null)
					this.handlers.LeftBattle({ User: user.Name, BattleID: oldBattleId });
				else
					this.handlers.JoinedBattle({ User: user.Name, BattleID: user.BattleID });
			}
		},
		"UserDisconnected": function(msg){
			if (msg.Name in this.users) {
				delete this.users[msg.Name];
				_.forEach(this.channels, function(ch){
					if (msg.Name in ch.users)
						delete ch.users[msg.Name];
				});
			} else {
				return true;
			}
		},

		// CHANNELS

		"JoinChannelResponse": function(msg){
			if (msg.Success) {
				this.channels[msg.ChannelName] = {
					name: msg.ChannelName,
					userCount: msg.UserCount,
					users: {}
				};
			} else {
				Log.errorBox('Couldn\'t join channel ' + msg.ChannelName + ': ' +
					msg.Reason);
				return true;
			}
			_.extend(this.channels[msg.ChannelName].users, _.reduce(msg.Channel.Users,
			function(acc, name){
				acc[name] = this.getOrCreateUser(name);
				return acc;
			}.bind(this), {}));
			if (msg.Channel.Topic && _.size(msg.Channel.Topic) > 0 /* ignore {} topics */) {
				this.channels[msg.ChannelName].topic = {
					text: msg.Channel.Topic.Text || '',
					author: msg.Channel.Topic.SetBy || '',
					time: new Date(msg.Channel.Topic.SetDate || ''),
				};
			} else {
				this.channels[msg.ChannelName].topic = null;
			}
		},
		"ChannelUserAdded": function(msg){
			this.channels[msg.ChannelName].users[msg.UserName] = this.getOrCreateUser(msg.UserName);
		},
		"ChannelUserRemoved": function(msg){
			delete this.channels[msg.ChannelName].users[msg.UserName];
		},

		// TEXT MESSAGES

		"Say": function(msg){
			var date = msg.Time && new Date(msg.Time);
			if (msg.Place === SayPlace.Channel)
				Chat.saidChannel(msg.Target, msg.User, msg.Text, msg.IsEmote, date || undefined);
			else if (msg.Place === SayPlace.User && msg.User === this.nick)
				Chat.sentPrivate(msg.Target, msg.Text, msg.IsEmote);
			else if (msg.Place === SayPlace.User)
				Chat.saidPrivate(msg.User, msg.Text, msg.IsEmote, date || undefined);
			else if (msg.Place === SayPlace.Battle)
				Chat.saidBattle(msg.User, msg.Text, msg.IsEmote);
			else if (msg.Place === SayPlace.BattlePrivate)
				Chat.saidBattle(msg.User, msg.Text, true);

			if (msg.Place === SayPlace.BattlePrivate && msg.Ring === true)
				Server.ringed();

			return true;
		},

		// BATTLES

		"BattleAdded": function(msg){
			this.battles[msg.Header.BattleID] = { teams: {}, boxes: {}, options: {} };
			this.handlers.BattleUpdate(msg);
		},
		"BattleUpdate": function(msg){
			var battle = msg.Header;
			if (!this.battles[battle.BattleID])
				return;
			extendUpdate(this.battles[battle.BattleID], {
				id: battle.BattleID,
				title: battle.Title,
				engine: battle.Engine,
				game: battle.Game,
				map: battle.Map,
				// Apparently, the string "?" means it's passworded.
				passworded: "Password" in battle ? !!battle.Password : undefined,
				maxPlayers: battle.MaxPlayers,
				spectatorCount: battle.SpectatorCount,
				playerCount: battle.PlayerCount,
				founder: battle.Founder,
				ip: battle.Ip,
				port: battle.Port,
				running: battle.IsRunning,
			});
		},
		"BattleRemoved": function(msg){
			delete this.battles[msg.BattleID];
		},
		"JoinedBattle": function(msg){
			Team.add(this.battles[msg.BattleID].teams, this.getOrCreateUser(msg.User), 1);
			this.users[msg.User].battle = msg.BattleID;
			if (msg.User === this.nick) {
				this.currentBattle = this.battles[msg.BattleID];
				if (this.specOnJoin)
					this.updateMultiplayerStatus({ spectator: true });
			}
		},
		"JoinBattleSuccess": function(msg){
			var handlers = this.handlers;
			msg.Players.forEach(function(p){ handlers.UpdateUserBattleStatus(p); });
			msg.Bots.forEach(function(p){ handlers.UpdateBotStatus(p); });
			handlers.SetModOptions(msg);
		},
		"LeftBattle": function(msg){
			Team.remove(this.battles[msg.BattleID].teams, msg.User);
			if (this.users[msg.User])
				delete this.users[msg.User].battle;
			if (msg.User === this.nick) {
				// Remove all bots so they don't linger forever.
				this.currentBattle.teams = _.mapValues(this.currentBattle.teams, function(team){
					return _.pick(team, function(u){ return !u.botType; });
				});
				this.currentBattle = null;
			}
		},
		"UpdateUserBattleStatus": function(msg){
			if (!this.currentBattle)
				return true;
			// If the user isn't in this.users by this point, it's a bot.
			var user = this.users[msg.Name] || { name: msg.Name };
			extendUpdate(user, {
				synced: ('Sync' in msg ? msg.Sync === 1 : undefined),
				serverAllyNumber: msg.AllyNumber, // internal for the store
				side: 0, // No protocol support yet.
				botType: msg.AiLib,
				botOwner: msg.Owner,
			});
			var team;
			var teams = this.currentBattle.teams;
			if (msg.AllyNumber !== undefined || msg.IsSpectator !== undefined) {
				Team.remove(teams, msg.Name);
				team = msg.IsSpectator ? 0 : user.serverAllyNumber + 1;
			} else {
				team = Team.getTeam(teams, msg.Name);
			}
			if (!isFinite(team))
				team = 1;
			if (!teams[team])
				teams[team] = {};
			if (teams[team][msg.Name])
				_.extend(teams[team][msg.Name], user);
			else
				teams[team][msg.Name] = user;
		},
		"UpdateBotStatus": function(msg){
			return this.handlers.UpdateUserBattleStatus(msg);
		},
		"RemoveBot": function(msg){
			this.handlers.LeftBattle({ BattleID: this.currentBattle.id, User: msg.Name });
		},
		"SetModOptions": function(msg){
			if (!this.currentBattle)
				return true;
			this.currentBattle.options = msg.Options;
		},
		"ConnectSpring": function(msg){
			/*
				public string Engine { get; set; }
				public string Ip { get; set; }
				public int Port { get; set; }
				public string Map { get; set; }
				public string Game { get; set; }
				public string ScriptPassword { get; set; }
			*/		
			
			
			var script = {
				isHost: 0,
				hostIp: msg.Ip,
				hostPort: msg.Port,
				myPlayerName: this.nick,
				myPasswd: msg.ScriptPassword,
			};
			if (this.sentLaunchRequest || !this.currentBattle || Team.getTeam(this.currentBattle.teams, this.nick) > 0){
				// TODO: move this logic to some util function called FixZkNihEngineNames
				if (msg.Engine.match(/^[0-9.]+-[0-9]+-g[a-f0-9]+$/)) // no branch suffix, add develop
					msg.Engine += ' develop';             
				Process.launchSpringScript(msg.Engine, { game: script });
			}
			this.sentLaunchRequest = false;
			
		},
		
		// match maeking
		"MatchMakerSetup": function(msg){
			this.queues = msg.PossibleQueues;
		},
		
		"MatchMakerStatus": function(msg){
			var enabled = msg.MatchMakerEnabled;
			var queues = msg.JoinedQueues;
			var queueCounts = msg.QueueCounts;
			var message = msg.Text || ""; 

			_.extend(this.queueCounts, queueCounts);
			
			if (queues) {
				this.activeQueues = queues;
				if (queues.length == 0){
					this.awaitingAccept = false;
				}
			}else if (!enabled){
				this.activeQueues = [];
			}
		},
		"AreYouReady": function(msg){
			this.awaitingAccept = true;
			Sound.playRing();
			
			//TODO
			var timeRemaining = msg.SecondsRemaining; // -> display countdown
		},
		"AreYouReadyUpdate": function(msg){
			var ready = msg.ReadyAccepted || msg.LikelyToPlay; 
			
			this.awaitingAccept = !ready;
			!ready && Sound.playRing();
		},
		"AreYouReadyResult": function(msg){
			this.awaitingAccept = false;
			
			//TODO
			var starting = msg.IsBattleStarting; // -> display battle failed when false
			var banned = msg.AreYouBanned; // -> display 5 minute MM ban
		},
		
		// remote control
		"SiteToLobbyCommand": function(msg){
			var springLink = msg.Command;
			
			// now onwards to handle something like this:
			// {"SpringLink\":\"@start_replay:http://zero-k.info/replays/20150625_165819_Sands of War v2_98.0.1-451-g0804ae1 develop.sdf,Zero-K v1.3.6.6,Sands of War v2,98.0.1-451-g0804ae1\"}
			if(springLink){
				// i wonder how similar to this are mission urls and if the parsing/handling should be modularized
				if(springLink.indexOf('@start_replay:') === 0){
					var repString = springLink.substring(14);
					var repArray = repString.split(',');
					
					var engine = repArray[3];
					
					// this is copypasta from MBattle store; maybe should move it to util 
					if (engine.match(/^[0-9.]+-[0-9]+-g[a-f0-9]+$/)) // no branch suffix, add develop
						engine += ' develop';
					
					Process.launchRemoteReplay(repArray[0],repArray[1],repArray[2],engine);
				}
			}
		},
	},
	message: function(data){
		Settings.dumpNetwork && Log.debug("[IN] " + data);
		var n = data.search(' ');
		var message = data.slice(0, n);
		var payload = JSON.parse(data.slice(n + 1));
		// Call the handler and trigger unless the handler returned true.
		if (this.handlers[message] && !this.handlers[message](payload))
			this.triggerSync();
	},
	send: function(message, payload){
		var str = message + ' ' + JSON.stringify(payload);
		Settings.dumpNetwork && Log.debug("[OUT] " + str);
		Server.sendRaw(str);
	},
	
})};
