/*
 * A multiplayer battle.
 *
 * This is an exception to the usual pattern of using actions to communicate
 * with the store, since the options for using actions are:
 *  - Actions that take the store as an argument.
 *  - Every store instance generates its own set of actions.
 * Both of those are functionally equivalent to plain methods.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var GameInfo = require('act/GameInfo.js');
var Process = require('act/Process.js');
var Battle = require('act/Battle.js');
var Chat = require('act/Chat.js');
var Team = require('util/Team.js');
var Sound = require('act/Sound.js');

// See SBattle.js for an explanation about typeTag.
var typeTag = {};

module.exports = function(gameInfoStore, serverStore, chatStore, processStore){ return Reflux.createStore({
	typeTag: typeTag,

	mixins: [require('store/BattleCommon.js')],

	init: function(){
		_.extend(this, this.getClearState());
		this.spads = false;
		this.playersInRoom = 0;
		this.scriptPassword = null;
		this.serverStore = serverStore;
		this.listenTo(gameInfoStore, 'updateGameInfo', 'updateGameInfo');
		this.listenTo(serverStore, 'updateServer', 'updateServer');
		this.listenTo(chatStore, 'updateChat', 'updateChat');
		this.listenTo(require('act/LobbyServer.js').ringed, 'ringed');
		this.listenTo(Chat.saidBattle, 'saidBattle');
	},
	dispose: function(){
		this.stopListeningToAll();
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},
	sendSyncStatus: function(){
		Battle.updateMultiplayerStatus({
			synced: this.hasEngine && this.hasGame && this.hasMap,
		});
	},

	updateServer: function(data){
		if (!data.currentBattle)
			return;
		var newState = {
			battleId: data.currentBattle.id,
			map: data.currentBattle.map,
			game: data.currentBattle.game,
			engine: data.currentBattle.engine,
			teams: data.currentBattle.teams,
			boxes: data.currentBattle.boxes,
			options: data.currentBattle.options,
			ip: data.currentBattle.ip,
			port: data.currentBattle.port,
			myName: data.nick,
			founder: data.currentBattle.founder,
			inProgress: ('running' in data.currentBattle) ? data.currentBattle.running : !!data.users[data.currentBattle.founder].inGame,
		};

		// Hack to replace removered zero-k hack at https://github.com/springfiles/upq/commit/11c82e.
		// If I'm not mistaken, zk infra uses branch suffixes for branches other than master or develop,
		// but if it doesn't, this won't work for them. I'm still reluctant to make swl branch suffix
		// agnostic since it would introduce ugliness in a lot of places.
		if (newState.engine.match(/^[0-9.]+-[0-9]+-g[a-f0-9]+$/)) // no branch suffix, add develop
			newState.engine += ' develop';

		if (this.map !== newState.map)
			GameInfo.loadMap(newState.map);
		if (this.game !== newState.game)
			GameInfo.loadGame(newState.game);

		var newEngine = this.engine !== newState.engine;
		var newGame = this.game !== newState.game;
		var newMap = this.map !== newState.map;

		if (newState.inProgress && this.inProgress !== newState.inProgress &&
				Team.getTeam(this.teams, this.myName) > 0 &&
				this.serverStore.storeName !== 'ZkLobbyServer') {
			this.launchSpring();
		}

		_.extend(this, newState);

		if (newEngine || newGame || newMap)
			this.updateSyncStatus();

		if (newEngine && !this.hasEngine)
			Process.downloadEngine(this.engine);
		if (newGame && !this.hasGame)
			Process.downloadGame(this.game);
		if (newMap && !this.hasMap)
			Process.downloadMap(this.map);

		// Play a sound when someone joins our room, but not if the room is full or there's >4 players.
		var newPlayersInRoom = Team.toList(_.omit(this.teams, '0')).length;
		if (newPlayersInRoom > this.playersInRoom && this.playersInRoom <= 4 &&
				this.playersInRoom < data.currentBattle.maxPlayers) {
			Sound.playDing();
		}
		this.playersInRoom = newPlayersInRoom;

		this.scriptPassword = data.users[data.nick].scriptPassword;

		this.triggerSync();
	},
	updateChat: function(data){
		this.chatLog = data.logs['##battleroom'];
		this.triggerSync();
	},
	launchSpring: function(){
		var script = {
			isHost: 0,
			hostIp: this.ip,
			hostPort: this.port,
			myPlayerName: this.myName,
			myPasswd: this.scriptPassword || this.myName,
		};
		Process.launchSpringScript(this.engine, { game: script });
	},
	ringed: function(){
		Sound.playRing();
		// We don't need to subscribe because we only care about the state at
		// this moment in time and don't need to do anything if the state
		// changes later.
		var downloads = processStore.getInitialState().downloads;
		var showDl = function(dl){
			var progress = dl.downloaded / dl.total * 100;
			return isFinite(progress) ? Math.round(progress) + '%. ' : '??%. ';
		};
		var dl;
		var message = '';
		if ((dl = _.find(downloads, { name: this.engine, type: 'engine' })))
			message += 'Downloading engine: ' + showDl(dl);
		if ((dl = _.find(downloads, { name: this.game, type: 'game' })))
			message += 'Downloading game: ' + showDl(dl);
		if ((dl = _.find(downloads, { name: this.map, type: 'map' })))
			message += 'Downloading map: ' + showDl(dl);
		if (message !== '')
			Chat.sayBattle(message, true);
	},
	saidBattle: function(user, message, me){
		if ((user !== 'Nightwatch' && user !== this.founder) || !me)
			return;
		var match;
		// Springie - note current format is:
		// "Nightwatch Poll: DO THING ? [!y=1/1, !n=0/1]"
		// "Nightwatch Poll: DO THING ? [END:SUCCESS]"
		if ( (match = message.match(/^Poll: (.*) \[(END.*|!y=([0-9]+)\/([0-9]+), !n=([0-9]+)\/([0-9]+))\]$/)) ) {
			if (match[2].match(/END/)) {
				this.vote = null;
			} else {
				this.vote = {
					message: match[1],
					yVotes: parseInt(match[3]),
					yVotesTotal: parseInt(match[4]),
					nVotes: parseInt(match[5]),
					nVotesTotal: parseInt(match[6]),
				};
			}
		// SPADS
		} else if ( (match = message.match(/called a vote.*"(.*)"/)) ) {
			this.vote = {
				message: match[1],
				yVotes: 1,
				yVotesTotal: 100,
				nVotes: 0,
				nVotesTotal: 100,
			};
		} else if ( (match = message.match(/Vote in progress: "([^"]+)" \[y:([0-9]+)\/([0-9]+), n:([0-9]+)\/([0-9]+)/)) ) {
			this.vote = {
				message: match[1],
				yVotes: parseInt(match[2]),
				yVotesTotal: parseInt(match[3]),
				nVotes: parseInt(match[4]),
				nVotesTotal: parseInt(match[5]),
			};
		} else if (message.match(/Vote for .*(passed|failed)|no vote in progress|[Vv]ote cancelled|[Cc]ancelling.*vote/)) {
			this.vote = null;
		} else if (message.match(/Hi.*\(SPADS.*automated host\)/)) {
			this.spads = true;
			return;
		}
		this.triggerSync();
	},

	// Public methods

	startGame: function(){
		if (!(this.hasEngine && this.hasGame && this.hasMap))
			return;
		if (this.inProgress) {
			if (this.serverStore.storeName === 'ZkLobbyServer') {
				Battle.requestConnectSpring(this.battleId);
			} else {
				this.launchSpring();
			}
		} else {
			Chat.sayBattle(this.spads ? '!cv start' : '!start');
		}
	},
	setEngine: _.noop,
	setGame: _.noop,
	setMap: function(ver){
		Chat.sayBattle('!map ' + ver);
	},
	setOwnSide: function(side){
		Battle.updateMultiplayerStatus({ side: side });
	},
	setOwnColor: function(color){
		Battle.updateMultiplayerStatus({ color: color });
	},
	setOwnTeam: function(team){
		Battle.updateMultiplayerStatus({
			ally: team === 0 ? 0 : team - 1,
			spectator: team === 0,
		});
	},
	setUserTeam: _.noop,
	kickUser: function(name){
		Battle.removeMultiplayerBot(name);
	},
	addBot: Battle.addMultiplayerBot,
	addBox: function(box){
		if (this.spads) {
			box = _.mapValues(box, function(x){ return Math.round(x * 200); });
			Chat.sayBattle('!addbox ' + box.left + ' ' + box.top + ' ' +
				(200 - box.right) + ' ' + (200 - box.bottom));
		} else {
			box = _.mapValues(box, function(x){ return Math.round(x * 100); });
			Chat.sayBattle('!addbox ' + box.left + ' ' + box.top + ' ' +
				(100 - box.right - box.left) + ' ' + (100 - box.bottom - box.top));
		}
	},
	removeBox: function(n){
		Chat.sayBattle('!clearbox ' + (n + 1));
	},
	clearBoxes: function(){
		Chat.sayBattle('!clearbox');
	},
	setOption: _.debounce(function(key, val){
		if (typeof val === 'boolean')
			val = val ? 1 : 0;
		if (this.spads)
			Chat.sayBattle('!bset ' + key + ' ' + val);
		else
			Chat.sayBattle('!setoptions ' + key + '=' + val);
	}, 500),
})};

module.exports.typeTag = typeTag;
