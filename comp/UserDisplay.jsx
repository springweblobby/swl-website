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
		var userLabel = <div>{this.state.nick}</div>
		if (this.state.connection === ConnectionState.CONNECTED) {
			var user = this.state.users[this.state.nick];
			var userImg = "";
			if (user.elo > 0 && user.level >= 0){ //zkls
				var level = Math.max(1, Math.min(7, Math.floor(8 - 7 * Math.exp(-user.level/65))));
				var skill = Math.max(0, Math.min(5, Math.floor((user.elo - 1200) / 200)));
				userImg = require('img/ranks/' + level + '_' + skill + '.png');
			}
			else if (user.timeRank >= 0) { //spring
				var level = user.timeRank + 1;
				var skill = 2;
				userImg = require('img/ranks/' + level + '_' + skill + '.png');
			}
			userLabel = <div><img src={userImg} /> {this.state.nick}</div>
		}
		return <button><div className="userLabel">{userLabel}</div></button>;
	}
});
