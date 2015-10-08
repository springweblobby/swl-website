'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Server = require('act/LobbyServer.js');
var ConnectionState = require('store/LobbyServerCommon.js').ConnectionState;

module.exports = React.createClass({
	mixins: [Reflux.connectFilter(require('store/LobbyServer.js'),
		_.partialRight(_.pick, 'connection'))],
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
