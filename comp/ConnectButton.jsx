/** @jsx React.DOM */

'use strict'

var Reflux = require('reflux');
var Server = require('../act/LobbyServer.js');
var ServerStore = require('../store/LobbyServer.js');
var ConState = ServerStore.ConState;

module.exports = React.createClass({
	mixins: [Reflux.listenTo(ServerStore, 'setState')],
	getInitialState: function(){
		return { connection: ConState.DISCONNECTED };
	},
	render: function(){
		if (this.state.connection === ConState.DISCONNECTED) {
			var onclick = Server.connect;
			var label = "Connect";
		} else if (this.state.connection === ConState.CONNECTING) {
			var onclick = Server.disconnect;
			var label = "Connecting";
		} else if (this.state.connection === ConState.CONNECTED) {
			var onclick = Server.disconnect;
			var label = "Connected";
		} else { 
			var onclick = null;
			var label = "[Unknown state, add support]";
		}
		return <button onClick={onclick}>{label}</button>;
	}
});
