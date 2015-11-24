/*
 * Sets away status after a set period of idleness.
 */

'use strict'

var minutesToAfk = 20;

var _ = require('lodash');
var Reflux = require('reflux');
var updateStatus = require('act/LobbyServer.js').updateStatus;
var ConnectionState = require('store/LobbyServerCommon.js').ConnectionState;

function resetTimer() {
	if (this.timeout !== null)
		clearTimeout(this.timeout);
	if (this.away)
		updateStatus({ away: false });
	if (!this.springRunning)
		this.timeout = setTimeout(_.partial(updateStatus, { away: true }), 60000 * minutesToAfk);
}

module.exports = function(lobbyServer, process){ return Reflux.createStore({

	listenables: [require('act/Chat.js'), require('act/Battle.js')],

	init: function(){
		this.timeout = null;
		this.away = false;
		this.springRunning = false;
		this.connected = false;

		this.listenTo(lobbyServer, this.updateServer, this.updateServer);
		this.listenTo(process, this.updateSpringRunning, this.updateSpringRunning);
	},
	updateServer: function(state){
		if (!this.connected && state.connection === ConnectionState.CONNECTED) {
			this.connected = true;
			this.resetTimer();
		} else if (this.connected && state.connection !== ConnectionState.CONNECTED &&
				this.timeout !== null) {
			this.connected = false;
			clearTimeout(this.timeout);
			this.timeout = null;
		}

		if (this.connected && state.nick in state.users)
			this.away = state.users[state.nick].away;
	},
	updateSpringRunning: function(state){
		if (this.springRunning && !state.springRunning && this.connected) {
			this.springRunning = false;
			if (!this.away)
				this.resetTimer();
		} else if (!this.springRunning && state.springRunning && this.timeout !== null) {
			this.springRunning = true;
			clearTimeout(this.timeout); // don't go afk while ingame.
			this.timeout = null;
		}
	},
	updateMultiplayerStatus: function(s){
		if (s.spectator === false)
			this.resetTimer();
	},
	resetTimer: resetTimer,

	sayChannel: resetTimer,
	sayPrivate: resetTimer,
	sayBattle: resetTimer,
	joinMultiplayerBattle: resetTimer,

})};
