/** @jsx React.DOM */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Chat = require('../act/Chat.js');
var ChatStore = require('../store/Chat.js');
var ServerStore = require('../store/LobbyServer.js');

var ChatLog = require('./ChatLog.jsx');
var ChatInput = require('./ChatInput.jsx');
var UserList = require('./UserList.jsx');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(ChatStore, 'updateLogs', 'updateLogs'),
		Reflux.listenTo(ServerStore, 'updateChannels', 'updateChannels')],
	getInitialState: function(){
		return {
			channels: {},
			privates: {},
			logs: {},
			selected: '',
		};
	},
	updateLogs: function(logs){
		this.setState({ logs: logs });
	},
	updateChannels: function(data){
		this.setState({ channels: data.channels });
	},
	handleSelect: function(val){
		this.setState({ selected: val });
	},
	handleSend: function(val){
		if (this.state.selected.match(/^#/))
			Chat.sayChannel(this.state.selected.slice(1), val);
		else
			Chat.sayPrivate(this.state.selected, val);
	},
	render: function(){
		var selected = this.state.selected;
		var log = this.state.logs[selected] || [];
		var users = null;
		if (selected.match(/^#/) && (selected.slice(1) in this.state.channels))
			var users = this.state.channels[selected.slice(1)].users;
		return (<div className="chatManager">
				<ul className="chatTabs">
					{_(this.state.channels).map(function(ch){
						return <li onClick={_.partial(this.handleSelect, '#'+ch.name)} key={'#'+ch.name}>{'#'+ch.name}</li>
					}.bind(this))}
					{_(this.state.privates).map(function(p){
						return <li onClick={_.partial(this.handleSelect, p.name)} key={p.name}>{p.name}</li>
					}.bind(this))}
				</ul>
				<div className="chatMain">
					<div className="chatLogContainer"><ChatLog log={log} /></div>
					<ChatInput onSend={this.handleSend} />
				</div>
				{users ? <div className="userListContainer"><UserList users={users} /></div> : null}
			</div>);
	}
});
