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
			boxes: {},
			name: Settings.name,
		});
		this.teams[1][this.name] = { name: this.name };
	},
	getDefaultData: function(){
		return {
			teams: this.teams,
			map: this.map,
			game: this.game,
			boxes: this.boxes,
		};
	},
	triggerSync: function(){
		this.trigger(this.getDefaultData());
	},
	
	// Public methods
	
	setOwnTeam: function(n){
		this.setUserTeam(this.name, n);
	},
	setUserTeam: function(name, n){
		var curTeam = _.findKey(this.teams, function(obj){ return this.name in obj; }.bind(this));
		if (curTeam && curTeam !== n){
			this.teams[n][this.name] = this.teams[curTeam][this.name];
			delete this.teams[curTeam][this.name];
			this.triggerSync();
		}
	},
};

module.exports = _.partial(Reflux.createStore, storeDescription);
