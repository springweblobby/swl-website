/*
 * This stores data about games and maps. This is the only point of access to
 * unitsync. The possibility of fetching this data from plasma with unitsync
 * acting as a fallback should be investigated.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('./Applet.js');
var Unitsync = require('./Unitsync.js');
var Log = require('./Log.js');

module.exports = Reflux.createStore({
	init: function(){
		_.extend(this, {
			games: {},
			maps: {},
			engines: {},

			resultHandlers: {},
		});

		// Callin for the API.
		window.unitsyncResult = function(id, type, result){
			this.resultHandlers[id] && this.resultHandlers[id](type, result);
			delete this.resultHandlers[id];
		}.bind(this);

		var unitsync = new Unitsync(Applet.getUnitsyncAsync("/home/user/.spring/weblobby/engine/98.0/libunitsync.so"), this.registerResultHandler.bind(this));
		unitsync.init(false, 0, function(){
			unitsync.getMapChecksumFromName("OnyxCauldron1.6", function(hash){
				console.log(hash);
			});
		});
	},
	getDefaultData: function(){
		return {
			games: this.games,
			maps: this.maps,
			engines: _.keys(this.engines),
		};
	},

	registerResultHandler: function(resultId, handler){
		this.resultHandlers[resultId] = handler;
	},
});
