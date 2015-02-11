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
var Settings = require('./Settings.js');
var GameInfo = require('../act/GameInfo.js');
var Process = require('../act/Process.js');
var Log = require('../act/Log.js');
var Battle = require('../act/Battle.js');

// See SBattle.js for an explanation about typeTag.
var typeTag = {};

var storePrototype = {
	typeTag: typeTag,
	init: function(){
		_.extend(this, {
			teams: { 1: {} },
			map: '',
			game: '',
			engine: '',
			boxes: {},
			myName: Settings.name || 'Player',

			gameInfo: { games: {}, maps: {}, engines: [] },
			hasMap: false,
			hasGame: false,
			hasEngine: false,
		});
		this.listenTo(require('./LobbyServer.js'), 'updateServer', 'updateServer');
		this.listenTo(require('./Chat.js'), 'updateChat', 'updateChat');
		this.listenTo(require('./GameInfo.js'), 'updateGameInfo', 'updateGameInfo');
	},
	dispose: function(){
		this.stopListeningToAll();
	},
	getInitialState: function(){
		return {
			teams: this.teams,
			myName: this.myName,
			map: this.map,
			game: this.game,
			engine: this.engine,
			boxes: this.boxes,
			hasMap: this.hasMap,
			hasGame: this.hasGame,
			hasEngine: this.hasEngine,
			chatLog: this.chatLog,
		};
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},

	updateServer: function(data){
		if (!data.currentBattle)
			return;
		_.extend(this, {
			map: data.currentBattle.map,
			game: data.currentBattle.game,
			engine: data.currentBattle.engine,
			teams: data.currentBattle.teams,
			ip: data.currentBattle.ip,
			port: data.currentBattle.port,
			myName: data.nick,
		});
		this.updateSyncedStatus();
		this.triggerSync();
	},
	updateChat: function(data){
		this.chatLog = data.logs['##battleroom'];
		this.triggerSync();
	},
	updateGameInfo: function(data){
		this.gameInfo = data;
		this.updateSyncedStatus();
		this.triggerSync();
	},
	updateSyncedStatus: function(){
		this.hasEngine = _.contains(this.gameInfo.engines, this.engine);
		this.hasGame = (this.game in this.gameInfo.games) && this.gameInfo.games[this.game].local;
		this.hasMap = (this.map in this.gameInfo.maps) && this.gameInfo.maps[this.map].local;
	},
	getUserTeam: function(name){
		return _.findKey(this.teams, function(obj){ return name in obj; });
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
		_(this.teams).forEach(function(team){
			if (team[name] && team[name].owner === this.myName)
				Battle.removeMultiplayerBot(name);
		});
	},
	addBot: function(team, name, type, side){
		//
	},
};

module.exports = _.partial(Reflux.createStore, storePrototype);
module.exports.typeTag = typeTag;
