/*
 * This is a proxy store that routes to the correct protocol implementation.
 * When connecting it creates the appropriate store based on the welcome
 * message from the server. After disconnecting the store is destroyed, but the
 * last state snapshot is retained.
 *
 * The underlying protocol store must implement the following:
 *  - dispose() method that gets called before disconnecting and destroying the store.
 *  - The broadcasted state must be the same as specified in getClearState().
 *  - It should look in the registering property to determine if we're registering.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('store/Applet.js');
var Log = require('act/Log.js');
var Settings = require('store/Settings.js');
var ServerCommon = require('store/LobbyServerCommon.js');

var SpringLobbyServer = require('store/SpringLobbyServer.js');
var ZkLobbyServer = require('store/ZkLobbyServer.js');

module.exports = function(){ return Reflux.createStore({

	listenables: require('act/LobbyServer.js'),

	init: function(){
		this.underlyingStore = null;
		this.state = ServerCommon.getClearState();

		if (Applet) {
			// Socket handlers for C++ API.
			if (window.on_socket_get !== undefined || window.on_socket_error !== undefined)
				throw new Error('LobbyServer: window.on_socket_get() and on_socket_error() already defined.');
			window.on_socket_get = this.message;
			window.on_socket_error = this.onError;
		}

		if (Settings.autoConnect && Settings.name && Settings.password)
			this.connect();
	},
	getInitialState: function(){
		return this.underlyingStore && this.underlyingStore.getInitialState() ||
			this.state;
	},
	triggerSync: function(){
		this.trigger(this.state);
	},

	underlyingStoreUpdate: function(state){
		this.state = state;
		this.triggerSync();
	},

	// Action listeners.

	connect: function(){
		this.connectInternal(null);
	},
	disconnect: function(){
		if (Applet)
			Applet.disconnect();
		else
			this.socket.close();
		this.state.connection = ServerCommon.ConnectionState.DISCONNECTED;
		if (this.underlyingStore) {
			this.stopListeningTo(this.underlyingStore);
			this.underlyingStore.dispose();
			this.underlyingStore = null;
		}
		this.triggerSync();
	},
	register: function(name, password, email){
		if (this.state.connection !== ServerCommon.ConnectionState.DISCONNECTED)
			this.disconnect();
		this.connectInternal({ name: name, password: password, email: email });
	},
	sendRaw: function(data){
		Applet ? Applet.send(data + '\n') : this.socket.send(data);
	},

	// Other methods.

	connectInternal: function(registering){
		if (this.state.connection !== ServerCommon.ConnectionState.DISCONNECTED)
			this.disconnect();
		if (Applet) {
			var host = Settings.lobbyServer.split(':')[0] ||
				Settings.useZkServer && 'lobby.zero-k.info' || 'lobby.springrts.com';
			var port = Settings.lobbyServer.split(':')[1] || '8200';
			Applet.connect(host, port);
		} else {
			// Connect to ZKLS over WebSocket.
			// Port 8203 should be used for the test site, but i couldn't figure out how to disambiguate.
			this.socket = new WebSocket(Settings.lobbyServer || 'ws://lobby.zero-k.info:8201');
			this.socket.onmessage = _.compose(this.message, function(obj){ return obj.data; }).bind(this);
			this.socket.onerror = this.socket.onclose = this.onError;
		}
		this.state = ServerCommon.getClearState();
		this.state.socket = this.socket;
		this.state.connection = ServerCommon.ConnectionState.CONNECTING;
		this.state.registering = registering;
		this.triggerSync();
	},
	message: function(msg){
		if (this.underlyingStore === null) {
			if (msg.match(/^TASServer/)) {
				this.underlyingStore = new SpringLobbyServer();
			} else if (msg.match(/^Welcome {/)) {
				this.underlyingStore = new ZkLobbyServer();
			} else {
				Log.errorBox('Unsupported server protocol\nUnrecognized welcome message: ' + msg);
				this.disconnect();
				return;
			}
			this.storeName = this.underlyingStore.storeName;

			_.extend(this.underlyingStore, this.state);
			this.listenTo(this.underlyingStore, this.underlyingStoreUpdate);
		}
		this.underlyingStore.message(msg);
	},
	onError: function(){
		this.disconnect();
	},
})};
