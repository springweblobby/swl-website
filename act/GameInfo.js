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

	// Call searchMaps() to start the search and then searchMapsMore() to obtain
	// more results if there are any.
	//
	// Possible search parameters:
	// https://github.com/ZeroK-RTS/Zero-K-Infrastructure/blob/master/Zero-K.info/Controllers/MapsController.cs#L91
	//
	// string search, bool? featured, int? offset, bool? assymetrical, int? sea,
	// int? hills, int? size, bool? elongated, bool? needsTagging, bool? isTeams,
	// bool? is1v1, bool? ffa, bool? chicken, int? isDownloadable = 1, int? special = 0
	"searchMaps",
	"searchMapsMore",

	// Load thumbnails for several maps at once. Takes an array of map names.
	"loadMapThumbnails",

	"setSpringSetting", // key, val
]);
