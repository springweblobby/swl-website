/*
 * This stores data about games and maps. This is the only point of access to
 * unitsync. The possibility of fetching this data from plasma with unitsync
 * acting as a fallback should be investigated.
 *
 * TODO: This is a mock currently. It should be split into a mock for use with
 * browsers and the actual store that really accesses unitsync.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');

module.exports = Reflux.createStore({
	init: function(){
		_.extend(this, {
			games: {
				"Zero-K v1.2.9.9": {
				},
				"Evolution RTS - v8.04": {
				},
			},
			maps: {
				"SuperSpeedMetal": {
				},
				"Titan-v2": {
				},
				"OnyxCauldron1.6": {
				},
				"Comet Catcher Redux v2": {
				},
			},
			engines: {},
		});
	},
	getDefaultData: function(){
		return {
			games: this.games,
			maps: this.maps,
			engines: this.engines,
		};
	},
});
