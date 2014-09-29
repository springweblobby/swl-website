/*
 * Handles logic related to lobby server state, handles the protocol.
 */
(function(){
    'use strict'

	var Reflux = require('reflux');
	var md5 = require('MD5');

	module.exports = Reflux.createStore({

		listenables: require('../act/LobbyServer.js'),

		init: function(){
			this.state = {
				connectionState: this.ConState.DISCONNECTED,
				nick: '',
				password: '',
			};
		},
		getDefaultData: function(){ return this.state; },

		ConState = {
			DISCONNECTED: 0,
			CONNECTING: 1,
			CONNECTED: 2
		},

		// Action listeners.

		connect: function(){
			this.socket = new WebSocket('ws://localhost:8260');
			this.state.connectionState = this.ConState.CONNECTING;
			this.socket.onmessage = this.message.bind(this);
			this.socket.onopen = this.login.bind(this);
			this.socket.onerror = this.socket.onclose = function(){
				this.state.connectionState = this.ConState.DISCONNECTED;
				this.trigger(this.state);
			}.bind(this);
		},
		disconnect: function(){
			this.socket.close();
		},

		// Not action listeners.

		login: function(){
			this.socket.send("LOGIN " + this.state.nick + ' ' + md5(this.state.password) + ' 7778 * SpringWebLobbyReactJS 0.1\t4236959782\tcl sp p');
		},
		message: function(msg){
			console.log(msg);
			if(msg.match(/^ACCEPTED/)){
				this.state.connectionState = this.ConState.CONNECTED;
				this.trigger(this.state);
			}
		}
	});

})()
