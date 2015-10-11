'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var SPM = require('comp/StorePropMixins.js');
var Server = require('act/LobbyServer.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var Settings = require('store/Settings.js');
var setSetting = require('act/Settings.js').set;

module.exports = React.createClass({
	displayName: 'LoginWindow',
	mixins: [
		React.addons.LinkedStateMixin,
		SPM.listenTo('serverStore', 'update'),
		Reflux.listenTo(Settings, 'updateSettings', 'updateSettings'),
	],
	getInitialState: function(){
		return {
			needNewLogin: false,
			needNewLoginCanceled: false,
			agreement: '',
			name: Settings.name,
			password: Settings.password,
		};
	},
	update: function(data){
		var newState = {
			needNewLogin: data.needNewLogin,
			agreement: data.agreement,
		};
		if (this.state.needNewLoginCanceled && !data.needNewLogin)
			newState.needNewLoginCanceled = false;
		this.setState(newState);
	},
	updateSettings: function(key){
		if (key === 'name' || key === 'password')
			this.setState({ name: Settings.name, password: Settings.password });
	},
	handleLogin: function(){
		setSetting('name', this.state.name);
		setSetting('password', this.state.password);
		Server.connect();
	},
	handleRegister: function(){
		Server.register(this.state.name, this.state.password);
	},
	handleCancel: function(){
		this.setState({ needNewLoginCanceled: true });
	},
	render: function(){
		if (this.state.agreement){
			return (<ModalWindow title="User Agreement" onClose={_.partial(Server.acceptAgreement, false)}>
				<div className="agreementText">{this.state.agreement}</div>
				<button onClick={_.partial(Server.acceptAgreement, true)}>Accept</button>
				<button onClick={_.partial(Server.acceptAgreement, false)}>Decline</button>
			</ModalWindow>);
		}

		if (!this.state.needNewLogin || this.state.needNewLoginCanceled)
			return null;

		return (<ModalWindow title="Log In" onClose={this.handleCancel}>
			<p>Login: <input type="text" valueLink={this.linkState('name')} /></p>
			<p>Password: <input type="password" valueLink={this.linkState('password')} /></p>
			<p>
				<button onClick={this.handleLogin}>Log in</button>
				<button onClick={this.handleRegister}>Register</button>
				<button onClick={this.handleCancel}>Cancel</button>
			</p>
		</ModalWindow>);
	}
});
