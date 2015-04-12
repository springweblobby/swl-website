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
	"sayBattle", // message [, me]

	"saidChannel", // channel, user, message [, me, timestamp]
	"saidPrivate", // user, message [, me, timestamp]
	// Our private message was succesfully sent.
	"sentPrivate", // user, message [, me]
	"saidBattle", // user, message, me

	"joinChannel", // channel [, password]
	"leaveChannel", // channel
	"openPrivate", // user
	"closePrivate", // user

	"subscribeToChannel", // channel, bool subscribe
	"subscribedToChannel", // channel, bool subscribed

	// Call with '' to select nothing.
	"selectLogSource", // channel (with # prefix) or user name
    
]);
