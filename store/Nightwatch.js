/*
 * Handles Nightwatch offline messages and other things it does.
 * This store has no internal state, it just passes actions around.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Chat = require('../act/Chat.js');
var ConnectionState = require('./LobbyServerCommon.js').ConnectionState;

module.exports = Reflux.createStore({

	listenables: Chat,

	init: function(){
		this.connected = false;
		this.subscribingTo = null;
		this.listenTo(require('./LobbyServer.js'), this.updateConnectionState);
	},

	updateConnectionState: function(data){
		if (data.connection === ConnectionState.CONNECTED &&
				data.users['Nightwatch'] && !this.connected) {
			Chat.sayPrivate('Nightwatch', '!listsubscriptions');
			this.connected = true;
		} else if (data.connection !== ConnectionState.CONNECTED) {
			this.connected = false;
		}
	},

	// Action listeners.
	
	subscribeToChannel: function(channel, subscribe){
		this.subscribingTo = channel;
		Chat.sayPrivate('Nightwatch', '!' + (subscribe ? '' : 'un') + 'subscribe #' + channel);
	},

	saidPrivate: function(user, message){
		if (user !== 'Nightwatch')
			return;

		if (message.match(/^!pm\|/)) {
			var pm = message.split('|').slice(1);
			Chat.saidChannel(pm[0], pm[1], pm[3], false, new Date( Date.parse(pm[2]) -
				(new Date()).getTimezoneOffset()*60000) );
		} else if (message.match(/^Subscribed to:/)) {
			message.replace(/^Subscribed to: /, '').split(', ').forEach(function(channel){
				Chat.subscribedToChannel(channel, true);
			});
		} else if (message === 'Subscribed' && this.subscribingTo) {
			Chat.subscribedToChannel(this.subscribingTo, true);
			this.subscribingTo = null;
		} else if (message === 'Unsubscribed' && this.subscribingTo) {
			Chat.subscribedToChannel(this.subscribingTo, false);
			this.subscribingTo = null;
		}
	},
});
