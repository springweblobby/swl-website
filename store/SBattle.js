/*
 * A single player battle.
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
var GameInfo = require('../act/GameInfo.js');
var Process = require('../act/Process.js');

// Due to the way stores are created it's not possible to use instanceof to
// dynamically tell the type of the battle store.
// To solve that we use this hack, so you can use store.typeTag === SBattle.typeTag
// in place of store instanceof SBattle.
var typeTag = {};

var storePrototype = {
	typeTag: typeTag,

	mixins: [require('./BattleCommon.js')],

	init: function(){
		_.extend(this, this.getClearState());
		this.teams[1] = {};
		this.teams[1][this.myName] = { name: this.myName, side: 0, bot: false };
		this.listenTo(require('./GameInfo.js'), 'updateGameInfo', 'updateGameInfo');
	},
	dispose: function(){
		this.stopListeningToAll();
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},

	// Public methods
	
	startGame: function(){
		if (!(this.hasEngine && this.hasGame && this.hasMap))
			return;
		var script = {
			isHost: 1,
			hostIp: '127.0.0.1',
			myPlayerName: this.myName,
			gameType: this.game,
			mapName: this.map,
			startPosType: 2,
		};
		var aiCount = 0;
		var teamCount = 0;
		for (var i in _.omit(this.teams, '0')) {
			script['allyTeam' + (i - 1)] = {};
			for (var j in this.teams[i]) {
				var user = this.teams[i][j];
				if (user.bot)
					script['ai' + (aiCount++)] = { team: teamCount, shortName: user.botType, name: user.name, spectator: 0, host: 0 };
				else
					script.player0 = { team: teamCount, name: this.myName, spectator: 0 };
				script['team' + (teamCount++)] = { allyTeam: i - 1, teamLeader: 0,
					side: this.gameInfo.games[this.game].sides[user.side].name };
			}
		}
		if (this.myName in this.teams[0])
			script.player0 = { name: this.myName, spectator: 1 };
		Process.launchSpringScript(this.engine, { game: script });
	},
	setEngine: function(ver){
		this.engine = ver;
		this.updateSyncedStatus();
		this.triggerSync();
	},
	setGame: function(ver){
		this.game = ver;
		this.updateSyncedStatus();
		GameInfo.loadGame(ver);
		this.triggerSync();
	},
	setMap: function(ver){
		this.map = ver;
		this.updateSyncedStatus();
		GameInfo.loadMap(ver);
		this.triggerSync();
	},
	setOwnSide: function(n){
		var myTeam = this.getUserTeam(this.myName);
		this.teams[myTeam][this.myName].side = n;
		this.triggerSync();
	},
	setOwnTeam: function(n){
		this.setUserTeam(this.myName, n);
	},
	setUserTeam: function(name, n){
		var team = this.getUserTeam(name);
		if (team && team !== n){
			this.teams[n][name] = this.teams[team][name];
			delete this.teams[team][name];
			this.triggerSync();
		}
	},
	kickUser: function(name){
		if (name === this.myName)
			return;
		_(this.teams).forEach(function(team){
			delete team[name];
		}.bind(this));
		this.triggerSync();
	},
	addBot: function(team, name, type, side){
		if (!type || !name || !team)
			return;
		if (typeof side === 'undefined')
			side = 0;
		this.kickUser(name);
		if (!this.teams[team])
			this.teams[team] = {};
		this.teams[team][name] = {
			name: name,
			side: side,
			bot: true,
			botType: type,
			botOwner: this.myName,
			removable: true,
		};
		this.triggerSync();
	},
};

module.exports = _.partial(Reflux.createStore, storePrototype);
module.exports.typeTag = typeTag;
