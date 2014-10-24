/** @jsx React.DOM
 *
 * This brings other chat components together and feeds them data.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Chat = require('../act/Chat.js');
var ChatStore = require('../store/Chat.js');
var ServerStore = require('../store/LobbyServer.js');

var ChatLog = require('./ChatLog.jsx');
var ChatInput = require('./ChatInput.jsx');
var ChatButtons = require('./ChatButtons.jsx');
var UserList = require('./UserList.jsx');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(ChatStore, 'updateLogs', 'updateLogs'),
		Reflux.listenTo(ServerStore, 'updateChannels', 'updateChannels')],
	getInitialState: function(){
		return {
			channels: {}, // no # prefix there
			privates: {},
			logs: {}, // channels are prefixed with #
			selected: '', // this uses # too
		};
	},
	componentWillMount: function(){
		_.defer(this.autoSelect);
	},
	// Try to select a valid tab because the current tab closed.
	autoSelect: function(){
		var sel = this.state.selected;
		if (!( sel.match(/^#/) && (sel.slice(1) in this.state.channels) || (sel in this.state.privates) ))
			sel = _.keys(this.state.channels).map(function(x){ return '#'+x; })[0] || _.keys(this.state.privates)[0] || '';
		this.setState({ selected: sel });
	},
	updateLogs: function(logs){
		this.setState({ logs: logs });
		this.autoSelect();
	},
	updateChannels: function(data){
		this.setState({ channels: data.channels });
		this.autoSelect();
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
			<ChatButtons selected={this.state.selected} />
			</div>
			<div className={'chatMain' + (users ? '' : ' noUserList')}>
				<ChatLog log={log} source={this.state.selected} />
				<ChatInput onSend={this.handleSend} />
			</div>
			{users ? <UserList users={users} /> : null}
		</div>);
	}
});
