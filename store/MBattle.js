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

// See SBattle.js for an explanation about typeTag.
var typeTag = {};

var storePrototype = {
	typeTag: typeTag,

	mixins: [require('store/BattleCommon.js')],

	init: function(){
		_.extend(this, this.getClearState());
		this.listenTo(require('store/GameInfo.js'), 'updateGameInfo', 'updateGameInfo');
		this.listenTo(require('store/LobbyServer.js'), 'updateServer', 'updateServer');
		this.listenTo(require('store/Chat.js'), 'updateChat', 'updateChat');
	},
	dispose: function(){
		this.stopListeningToAll();
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},
	sendSyncStatus: function(){
		Battle.updateMyStatus({
			synced: this.hasEngine && this.hasGame && this.hasMap,
		});
	},

	updateServer: function(data){
		if (!data.currentBattle)
			return;
		var newState = {
			map: data.currentBattle.map,
			game: data.currentBattle.game,
			engine: data.currentBattle.engine,
			teams: data.currentBattle.teams,
			boxes: data.currentBattle.boxes,
			options: data.currentBattle.options,
			ip: data.currentBattle.ip,
			port: data.currentBattle.port,
			myName: data.nick,
			inProgress: !!data.users[data.currentBattle.founder].inGame,
		};

		if (this.map !== newState.map)
			GameInfo.loadMap(newState.map);
		if (this.game !== newState.game)
			GameInfo.loadGame(newState.game);

		var newEngine = this.engine !== newState.engine;
		var newGame = this.game !== newState.game;
		var newMap = this.map !== newState.map;

		if (newState.inProgress && this.inProgress !== newState.inProgress &&
				Team.getTeam(this.teams, this.myName) > 0) {
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
			myPasswd: this.myName,
		};
		Process.launchSpringScript(this.engine, { game: script });
	},

	// Public methods

	startGame: function(){
		if (!(this.hasEngine && this.hasGame && this.hasMap))
			return;
		if (this.inProgress) {
			this.launchSpring();
		} else {
			Chat.sayBattle('!start'); // TODO: Spads.
		}
	},
	setEngine: _.noop,
	setGame: _.noop,
	setMap: function(ver){
		Chat.sayBattle('!map ' + ver);
	},
	setOwnSide: _.noop,
	setOwnTeam: function(team){
		Battle.updateMyStatus({
			ally: team === 0 ? 0 : team - 1,
			spectator: team === 0,
		});
	},
	setUserTeam: _.noop,
	kickUser: function(name){
		Battle.removeMultiplayerBot(name);
	},
	addBot: function(team, name, type, side){
		Battle.addMultiplayerBot(team, name, type, side);
	},
	addBox: function(box){
		// TODO: Spads.
		box = _.mapValues(box, function(x){ return Math.round(x * 100); });
		Chat.sayBattle('!addbox ' + box.left + ' ' + box.top + ' ' +
			(100 - box.right - box.left) + ' ' + (100 - box.bottom - box.top));
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
		Chat.sayBattle('!setoptions ' + key + '=' + val);
	}, 500),
};

module.exports = _.partial(Reflux.createStore, storePrototype);
module.exports.typeTag = typeTag;
