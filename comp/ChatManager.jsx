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
				<div className="chatLeft">
				<ul className="chatTabs">
					{_(this.state.channels).map(function(ch){
						var click = _.partial(this.handleSelect, '#'+ch.name);
						var sel = '#'+ch.name === this.state.selected;
						return <li onClick={click} key={'#'+ch.name} className={sel ? 'selected' : ''}>{'#'+ch.name}</li>
					}.bind(this))}
					{_(this.state.privates).map(function(p){
						var click = _.partial(this.handleSelect, p.name);
						var sel = p.name === this.state.selected;
						return <li onClick={click} key={p.name} className={sel ? 'selected' : ''}>{p.name}</li>
					}.bind(this))}
				</ul>
				<div className="chatButtons">
					<img src="img/plus-small.png" />
					<img src="img/Remove.png" />
					<img src="img/news_subscribe.png" />
					<img src="img/heart_small.png" />
				</div>
				</div>
				<div className={'chatMain' + (users ? '' : ' noUserList')}>
					<ChatLog log={log} />
					<ChatInput onSend={this.handleSend} />
				</div>
				{users ? <UserList users={users} /> : null}
			</div>);
	}
});
