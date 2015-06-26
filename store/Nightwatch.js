/*
 * Handles Nightwatch offline messages and other things it does.
 * This store has no internal state, it just passes actions around.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Chat = require('act/Chat.js');
var Process = require('act/Process.js');
var ConnectionState = require('store/LobbyServerCommon.js').ConnectionState;

module.exports = Reflux.createStore({

	listenables: Chat,

	init: function(){
		this.connected = false;
		this.subscribingTo = null;
		this.listenTo(require('store/LobbyServer.js'), this.updateConnectionState);
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
		} else if( message.indexOf('!JSON') === 0 ) {
			var message = message.split(' ');
			var jsonCmd = message[1];
			var jsonString = message.slice(2).join(' ');
			var json = JSON.parse('(' + jsonString + ')');
			
			if( jsonCmd === 'SiteToLobbyCommand' )
			{
				var springLink = json['SpringLink'];
				
				// now onwards to handle something like this:
				// {"SpringLink\":\"@start_replay:http://zero-k.info/replays/20150625_165819_Sands of War v2_98.0.1-451-g0804ae1 develop.sdf,Zero-K v1.3.6.6,Sands of War v2,98.0.1-451-g0804ae1\"}
				
				if(springLink){
					// i wonder how similar to this are mission urls and if the parsing/handling should be modularized
					
					if(springLink.indexOf('@start_replay:') === 0){
						var repString = springLink.substring(14);
						var repArray = repString.split(',');
						
						Process.launchRemoteReplay(repArray[0],repArray[1],repArray[2],repArray[3]);
					}
				}
			}
		}
	},
});
