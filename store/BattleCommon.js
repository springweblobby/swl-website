/*
 * Code common to all battle stores.
 */

'use strict'

var _ = require('lodash');
var Settings = require('./Settings.js');

module.exports = {
	getClearState: function(){
		return {
			teams: {},
			map: '',
			game: '',
			engine: '',
			boxes: {},
			myName: Settings.name || 'Player',

			gameInfo: { games: {}, maps: {}, engines: [] },
			hasMap: false,
			hasGame: false,
			hasEngine: false,
		};
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
};
