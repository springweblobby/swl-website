/*
 * Mixin with some common functions for LobbyServer stores.
 */

var md5 = require('md5');
var Applet = require('store/Applet.js');
var Settings = require('store/Settings.js');
var Chat = require('act/Chat.js');
var Server = require('act/LobbyServer.js');
var Log = require('act/Log.js');

module.exports = {
	ConnectionState: {
		DISCONNECTED: 0,
		CONNECTING: 1,
		CONNECTED: 2
	},

	// Returns the initial state for initializing the store.
	getClearState: function(){
		return {
			connection: this.ConnectionState.DISCONNECTED,
			nick: Settings.name,
			users: {},
			channels: {},
			battles: {},
			currentBattle: null,
			agreement: '', // if not empty, agreement to be accepted
			needNewLogin: false, // last login attempt failed
			specOnJoin: false,
			queues: [],
			activeQueues: [],
			queueCounts: [],
			awaitingAccept: false,
		};
	},
	getInitialState: function(){
		return {
			connection: this.connection,
			nick: this.nick,
			users: this.users,
			channels: this.channels,
			battles: this.battles,
			currentBattle: this.currentBattle,
			agreement: this.agreement,
			needNewLogin: this.needNewLogin,
			queues: this.queues,
			activeQueues: this.activeQueues,
			queueCounts: this.queueCounts,
			awaitingAccept: this.awaitingAccept,
		};
	},

	autoJoinChannels: function(){
		Settings.autoJoin.split('\n').forEach(function(channel){
			if (channel.match(/^#/))
				Chat.joinChannel(channel.slice(1));
			else
				Chat.openPrivate(channel);
		});
	},
	hashPassword: function(password){
		return new Buffer(md5(password), 'hex').toString('base64');
	},
	getUserID: function(){
		var n = Applet && Applet.getUserID() || 0;
		// Return unsigned int32 even if the API returns signed.
		return n >= 0 ? n : 0xffffffff + 1 + n;
	},
	validateLoginPassword: function(login, password){
		var err = function(){
			this.needNewLogin = true;
			this.triggerSync();
			Server.disconnect();
			return false;
		}.bind(this);
		if (login === ''){
			return err();
		} else if (password === ''){
			Log.errorBox('Password cannot be empty.');
			return err();
		} else if (login.match(/[^a-zA-Z0-9_\[\]]/)) {
			Log.errorBox('Login can only contain letters, digits, [, ] and _');
			return err();
		}
		return true;
	},
};
