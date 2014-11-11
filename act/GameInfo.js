/*
 * GameInfo actions.
 */

'use strict'

var Reflux = require('reflux');

module.exports = Reflux.createActions([
	// Obtain possible info about a game or a map. Gets remote data and queries
	// unitsync if we have the game/map locally.
	"loadGame",
	"loadMap",

	// Rebuild the list of local engines/games/maps.
	"loadEngines",
	"loadGames",
	"loadMaps",
]);
