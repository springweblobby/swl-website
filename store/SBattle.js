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
var Settings = require('./Settings.js');
var GameInfo = require('./GameInfo.js');

var storeDescription = {
	init: function(){
		_.extend(this, {
			teams: { 1: {} },
			map: '',
			game: '',
			engine: '',
			boxes: {},
			myName: Settings.name,

			gameInfo: { games: {}, maps: {}, engines: [] },
			hasMap: false,
			hasGame: false,
			hasEngine: false,
		});
		this.teams[1][this.myName] = { name: this.myName, bot: false };
		this.listenTo(GameInfo, 'updateGameInfo', 'updateGameInfo');
	},
	getDefaultData: function(){
		return {
			teams: this.teams,
			map: this.map,
			game: this.game,
			engine: this.engine,
			boxes: this.boxes,
			hasMap: this.hasMap,
			hasGame: this.hasGame,
			hasEngine: this.hasEngine,
		};
	},
	triggerSync: function(){
		this.trigger(this.getDefaultData());
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

	// Public methods
	
	setEngine: function(ver){
		this.engine = ver;
		this.updateSyncedStatus();
		this.triggerSync();
	},
	setGame: function(ver){
		this.game = ver;
		this.updateSyncedStatus();
		this.triggerSync();
	},
	setMap: function(ver){
		this.map = ver;
		this.updateSyncedStatus();
		this.triggerSync();
	},
	setOwnTeam: function(n){
		this.setUserTeam(this.myName, n);
	},
	setUserTeam: function(name, n){
		var curTeam = _.findKey(this.teams, function(obj){ return name in obj; }.bind(this));
		if (curTeam && curTeam !== n){
			this.teams[n][name] = this.teams[curTeam][name];
			delete this.teams[curTeam][name];
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
	addBot: function(type, name, team){
		if (!type || !name || !team)
			return;
		this.kickUser(name);
		if (!this.teams[team])
			this.teams[team] = {};
		this.teams[team][name] = {
			name: name,
			bot: true,
			botType: type,
			botOwner: this.myName,
			removable: true,
		};
		this.triggerSync();
	},
	close: _.noop,
};

module.exports = _.partial(Reflux.createStore, storeDescription);
