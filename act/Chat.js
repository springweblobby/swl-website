/*
 * Actions for dealing with chat.
 */

'use strict'

var Reflux = require('reflux');

// In the arguments list me means /me messages.
// Channel names don't have the # prefix.
module.exports = Reflux.createActions([
	"sayChannel", // channel, message [, me]
	"sayPrivate", // user, message
	"sayBattle", // message

	"saidChannel", // channel, user, message, me
	"saidPrivate", // user, message
	"saidBattle", // user, message, me

	"joinChannel", // channel [, password]
	"leaveChannel", // channel
]);
