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
var GameInfo = require('act/GameInfo.js');
var Process = require('act/Process.js');
var Team = require('util/Team.js');
var teamColors = require('comp/TeamColorPicker.jsx').colors;

// Due to the way stores are created it's not possible to use instanceof to
// dynamically tell the type of the battle store.
// To solve that we use this hack, so you can use store.typeTag === SBattle.typeTag
// in place of store instanceof SBattle.
var typeTag = {};

module.exports = function(gameInfoStore){ return Reflux.createStore({
	typeTag: typeTag,

	mixins: [require('store/BattleCommon.js')],

	init: function(){
		_.extend(this, this.getClearState());
		this.teams[1] = {};
		this.teams[1][this.myName] = { name: this.myName, side: 0, color: _.sample(teamColors) };
		this.listenTo(gameInfoStore, 'updateGameInfo', 'updateGameInfo');
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
			modoptions: this.options,
		};
		var aiCount = 0;
		var teamCount = 0;
		for (var i in _.omit(this.teams, '0')) {
			var allyTeam = { numAllies: 0 };
			if (this.boxes[i - 1]) {
				_.extend(allyTeam, {
					startRectLeft: this.boxes[i - 1].left,
					startRectTop: this.boxes[i - 1].top,
					startRectRight: 1 - this.boxes[i - 1].right,
					startRectBottom: 1 - this.boxes[i - 1].bottom,
				});
			}
			script['allyTeam' + (i - 1)] = allyTeam;
			for (var j in this.teams[i]) {
				var user = this.teams[i][j];
				if (user.botType)
					script['ai' + (aiCount++)] = { team: teamCount, shortName: user.botType, name: user.name, spectator: 0, host: 0 };
				else
					script.player0 = { team: teamCount, name: this.myName, spectator: 0 };
				script['team' + (teamCount++)] = {
					allyTeam: i - 1,
					teamLeader: 0,
					side: this.gameInfo.games[this.game].sides && this.gameInfo.games[this.game].sides[user.side] && this.gameInfo.games[this.game].sides[user.side].name,
					rgbcolor: (user.color ? user.color.map(function(n){ return n / 255; }).
						map(String).join(' ') : undefined),
				};
			}
		}
		if (this.teams[0] && (this.myName in this.teams[0]))
			script.player0 = { name: this.myName, spectator: 1 };
		Process.launchSpringScript(this.engine, { game: script });
	},
	setEngine: function(ver){
		this.engine = ver;
		this.updateSyncStatus();
		if (!this.hasEngine)
			Process.downloadEngine(this.engine);
		this.triggerSync();
	},
	setGame: function(ver){
		this.game = ver;
		this.updateSyncStatus();
		if (!this.hasGame)
			Process.downloadGame(this.game);
		GameInfo.loadGame(ver);
		this.triggerSync();
	},
	setMap: function(ver){
		this.map = ver;
		this.updateSyncStatus();
		if (!this.hasMap)
			Process.downloadMap(this.map);
		GameInfo.loadMap(ver);
		this.triggerSync();
	},
	setOwnSide: function(n){
		var myTeam = Team.getTeam(this.teams, this.myName);
		this.teams[myTeam][this.myName].side = n;
		this.triggerSync();
	},
	setOwnColor: function(color){
		var myTeam = Team.getTeam(this.teams, this.myName);
		this.teams[myTeam][this.myName].color = color;
		this.triggerSync();
	},
	setOwnTeam: function(n){
		this.setUserTeam(this.myName, n);
	},
	setUserTeam: function(name, n){
		Team.move(this.teams, name, n);
		this.triggerSync();
	},
	kickUser: function(name){
		if (name === this.myName || isNaN(Team.getTeam(this.teams, name)))
			return;
		Team.remove(this.teams, name);
		this.triggerSync();
	},
	addBot: function(bot){
		if (typeof bot.side === 'undefined')
			bot.side = 0;
		this.kickUser(bot.name);
		Team.add(this.teams, _.extend(bot, {
			botType: bot.type,
			botOwner: this.myName,
		}), bot.team);
		this.triggerSync();
	},
	addBox: function(box){
		var n = 0;
		while(n in this.boxes) n++;
		this.boxes[n] = box;
		this.triggerSync();
	},
	removeBox: function(n){
		delete this.boxes[n];
		this.triggerSync();
	},
	clearBoxes: function(){
		this.boxes = {};
		this.triggerSync();
	},
	setOption: function(key, val){
		this.options[key] = val;
		this.triggerSync();
	},
})};

module.exports.typeTag = typeTag;
