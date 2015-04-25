/*
 * Sets away status after a set period of idleness.
 */

'use strict'

var minutesToAfk = 20;

var _ = require('lodash');
var Reflux = require('reflux');
var updateStatus = require('act/LobbyServer.js').updateStatus;
var ConnectionState = require('store/LobbyServerCommon.js').ConnectionState;

var timeout = null;
var away = false;
var springRunning = false;
var connected = false;

function resetTimer() {
	if (timeout !== null)
		clearTimeout(timeout);
	if (away)
		updateStatus({ away: false });
	if (!springRunning)
		timeout = setTimeout(_.partial(updateStatus, { away: true }), 60000 * minutesToAfk);
}

module.exports = Reflux.createStore({
	listenables: require('act/Chat.js'),

	init: function(){
		this.listenTo(require('store/LobbyServer.js'), this.updateServer, this.updateServer);
		this.listenTo(require('store/Process.js'), this.updateSpringRunning, this.updateSpringRunning);
	},
	updateServer: function(state){
		if (!connected && state.connection === ConnectionState.CONNECTED) {
			connected = true;
			resetTimer();
		} else if (connected && state.connection !== ConnectionState.CONNECTED && timeout !== null) {
			connected = false;
			clearTimeout(timeout);
			timeout = null;
		}

		if (connected)
			away = state.users[state.nick].away;
	},
	updateSpringRunning: function(state){
		if (springRunning && !state.springRunning && connected && !away) {
			springRunning = false;
			resetTimer();
		} else if (!springRunning && state.springRunning && timeout !== null) {
			springRunning = true;
			clearTimeout(timeout); // don't go afk while ingame.
			timeout = null;
		}
	},

	sayChannel: resetTimer,
	sayPrivate: resetTimer,
	sayBattle: resetTimer,
});
