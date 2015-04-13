/*
 * Code common to all battle stores.
 */

'use strict'

var _ = require('lodash');
var Settings = require('store/Settings.js');
var GameInfo = require('act/GameInfo.js');

module.exports = {
	getClearState: function(){
		return {
			teams: {},
			map: '',
			game: '',
			engine: '',
			boxes: {},
			options: {},
			vote: null,
			myName: Settings.name || 'Player',

			gameInfo: { games: {}, maps: {}, engines: [] },
			hasMap: false,
			hasGame: false,
			hasEngine: false,
			inProgress: false,
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
			options: this.options,
			hasMap: this.hasMap,
			hasGame: this.hasGame,
			hasEngine: this.hasEngine,
			chatLog: this.chatLog,
			inProgress: this.inProgress,
			vote: this.vote,
		};
	},

	updateGameInfo: function(data){
		this.gameInfo = data;
		var hasGame = this.hasGame;
		var hasMap = this.hasMap;
		this.updateSyncStatus();
		if (!hasGame && this.hasGame)
			GameInfo.loadGame(this.game);
		if (!hasMap && this.hasMap)
			GameInfo.loadMap(this.map);
		this.triggerSync();
	},
	updateSyncStatus: function(){
		this.hasEngine = _.contains(this.gameInfo.engines, this.engine);
		this.hasGame = (this.game in this.gameInfo.games) && !!this.gameInfo.games[this.game].local;
		this.hasMap = (this.map in this.gameInfo.maps) && !!this.gameInfo.maps[this.map].local;
		this.sendSyncStatus && this.sendSyncStatus();
	},
};
