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

// See SBattle.js for an explanation about typeTag.
var typeTag = {};

var storePrototype = {
	typeTag: typeTag,

	mixins: [require('store/BattleCommon.js')],

	init: function(){
		_.extend(this, this.getClearState());
		this.listenTo(require('store/LobbyServer.js'), 'updateServer', 'updateServer');
		this.listenTo(require('store/Chat.js'), 'updateChat', 'updateChat');
		this.listenTo(require('store/GameInfo.js'), 'updateGameInfo', 'updateGameInfo');
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
		if (this.map !== data.currentBattle.map)
			GameInfo.loadMap(data.currentBattle.map);
		if (this.game !== data.currentBattle.game)
			GameInfo.loadGame(data.currentBattle.game);
		var shouldUpdateSync = this.map !== data.currentBattle.map ||
			this.game !== data.currentBattle.game ||
			this.engine !== data.currentBattle.engine;
		_.extend(this, {
			map: data.currentBattle.map,
			game: data.currentBattle.game,
			engine: data.currentBattle.engine,
			teams: data.currentBattle.teams,
			boxes: data.currentBattle.boxes,
			ip: data.currentBattle.ip,
			port: data.currentBattle.port,
			myName: data.nick,
			inProgress: !!data.users[data.currentBattle.founder].inGame,
		});
		if (shouldUpdateSync)
			this.updateSyncStatus();
		this.triggerSync();
	},
	updateChat: function(data){
		this.chatLog = data.logs['##battleroom'];
		this.triggerSync();
	},

	// Public methods

	startGame: function(){
		if (!(this.hasEngine && this.hasGame && this.hasMap))
			return;
		var script = {
			isHost: 0,
			hostIp: this.ip,
			hostPort: this.port,
			myPlayerName: this.myName,
			myPasswd: this.myName,
		};
		Process.launchSpringScript(this.engine, { game: script });
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
};

module.exports = _.partial(Reflux.createStore, storePrototype);
module.exports.typeTag = typeTag;
