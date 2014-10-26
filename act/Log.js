/*
 * Logging and error/info messages.
 */

'use strict'

var Reflux = require('reflux');

// Actions with the Box suffix log the error and then display a message box to the user.
module.exports = Reflux.createActions([
	"debug",
	"debugBox",

	"info",
	"infoBox",

	"warning",
	"warningBox",

	"error",
	"errorBox",

	"messageBox", // message, title

	// Pop the current message box in the stack. Call this when user hits OK.
	"popMessageBox",
]);
