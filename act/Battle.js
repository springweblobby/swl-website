/*
 * Actions for opening battles.
 */

'use strict'

var Reflux = require('reflux');

module.exports = Reflux.createActions([
	// Takes the title of the new battle and an init function that takes the
	// new store as the argument, "this" is bound to the new store as well.
	"openSinglePlayerBattle",
	"hostBattle",
	// Joining multiplayer battles is handled by CurrentBattle.
]);
