'use strict'

var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');
var Server = require('act/LobbyServer.js');
var ConnectionState = require('store/LobbyServerCommon.js').ConnectionState;
var Settings = require('store/Settings.js');
var LobbyServer = require('store/LobbyServer.js');

module.exports = React.createClass({
	displayName: 'ConnectButton',
	mixins: [SPM.connect('serverStore', '', ['connection', 'users', 'nick'])],
	render: function(){
		var onclick, img, imgBack, label;
		var userLabel = null;
		if (this.state.connection === ConnectionState.DISCONNECTED) {
			onclick = Server.connect;
			img = require('img/plug-disconnected.png');
			label = 'Connect';
		} else if (this.state.connection === ConnectionState.CONNECTING) {
			onclick = Server.disconnect;
			img = require('img/blue.png')
			label = 'Connecting';
		} else if (this.state.connection === ConnectionState.CONNECTED) {
			onclick = Server.disconnect;
			img = require('img/green.png');
			imgBack = require('img/logout.png');

			var user = this.state.users[this.state.nick];
			if (user.elo > 0 && user.level >= 0){ //zkls
				var level = Math.max(0, Math.min(7, Math.floor(Math.log(user.level / 30 + 1) * 4.2)));
				var skill = Math.max(0, Math.min(7, Math.floor((user.elo - 1000) / 200)));
				img = require('img/ranks/' + level + '_' + skill + '.png');
			}
			else if (user.timeRank >= 0) { //spring
				var level = Math.min(7, user.timeRank);
				var skill = 3;
				img = require('img/ranks/' + level + '_' + skill + '.png');
			}
			label = this.state.nick;
		} else { 
			onclick = null;
			img = null;
			label = "[Unknown state, add support]";
		}
		// Should probably move the user label into a separate component.
		// Because now if you click on it you get disconnected.
		return <button onClick={onclick}><img src={img} />  {label}{imgBack && <span>   <img src={imgBack} /></span>}
		</button>;
	}
});
