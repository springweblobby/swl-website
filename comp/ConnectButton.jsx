/** @jsx React.DOM */

'use strict'

var Reflux = require('reflux');
var Server = require('../act/LobbyServer.js');
var ServerStore = require('../store/LobbyServer.js');
var ConnectionState = require('../store/LobbyServerCommon.js').ConnectionState;

module.exports = React.createClass({
	mixins: [Reflux.listenTo(ServerStore, 'update', 'update')],
	getInitialState: function(){
		return { connection: ConnectionState.DISCONNECTED };
	},
	update: function(data){
		this.setState({ connection: data.connection });
	},
	render: function(){
		var onclick, img, label;
		if (this.state.connection === ConnectionState.DISCONNECTED) {
			onclick = Server.connect;
			img = 'img/red.png';
			label = 'Connect';
		} else if (this.state.connection === ConnectionState.CONNECTING) {
			onclick = Server.disconnect;
			img = 'img/blue.png'
			label = 'Connecting';
		} else if (this.state.connection === ConnectionState.CONNECTED) {
			onclick = Server.disconnect;
			img = 'img/green.png';
			label = 'Connected';
		} else { 
			onclick = null;
			img = null;
			label = "[Unknown state, add support]";
		}
		return <button onClick={onclick}><img src={img} /> {label}</button>;
	}
});
