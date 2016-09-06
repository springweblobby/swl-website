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
		var onclick, img, label;
		var userLabel = null;
		if (this.state.connection === ConnectionState.DISCONNECTED) {
			onclick = Server.connect;
			img = require('img/red.png');
			label = 'Connect';
		} else if (this.state.connection === ConnectionState.CONNECTING) {
			onclick = Server.disconnect;
			img = require('img/blue.png')
			label = 'Connecting';
		} else if (this.state.connection === ConnectionState.CONNECTED) {
			onclick = Server.disconnect;
			img = require('img/green.png');
			label = 'Connected';

			var user = this.state.users[this.state.nick];
			var userImg = "";
			if (user.elo > 0 && user.level >= 0){ //zkls
				var level = Math.max(1, Math.min(9, Math.floor(10 - 9 * Math.exp(-user.level/60))));
				var skill = Math.max(0, Math.min(5, Math.floor((user.elo - 1200) / 200)));
				userImg = require('img/ranks/' + level + '_' + skill + '.png');
			}
			else if (user.timeRank >= 0) { //spring
				var level = user.timeRank + 1;
				var skill = 2;
				userImg = require('img/ranks/' + level + '_' + skill + '.png');
			}
			userLabel = <div><img src={userImg} /> {this.state.nick}</div>
		} else { 
			onclick = null;
			img = null;
			label = "[Unknown state, add support]";
		}
		// Should probably move the user label into a separate component.
		// Because now if you click on it you get disconnected.
		return <button onClick={onclick}><img src={img} /> {label}
			<div className="userLabel">{userLabel}</div>
		</button>;
	}
});
