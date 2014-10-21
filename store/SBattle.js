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

var storeDescription = {
	init: function(){
		_.extend(this, {
			teams: { 1: {} },
			map: '',
			game: '',
			engine: '',
			boxes: {},
			myName: Settings.name,
		});
		this.teams[1][this.myName] = { name: this.myName, bot: false };
	},
	getDefaultData: function(){
		return {
			teams: this.teams,
			map: this.map,
			game: this.game,
			engine: this.engine,
			boxes: this.boxes,
		};
	},
	triggerSync: function(){
		this.trigger(this.getDefaultData());
	},
	
	// Public methods
	
	setEngine: function(ver){
		this.engine = ver;
		this.triggerSync();
	},
	setGame: function(ver){
		this.game = ver;
		this.triggerSync();
	},
	setMap: function(ver){
		this.map = ver;
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
	addBot: function(type, name, team){
		if (!this.teams[team])
			this.teams[team] = {};
		this.teams[team][name] = { name: name, bot: true, botName: type };
		this.triggerSync();
	},
	close: _.noop,
};

module.exports = _.partial(Reflux.createStore, storeDescription);
