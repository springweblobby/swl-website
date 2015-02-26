/** @jsx React.DOM
 *
 * This brings other chat components together and feeds them data.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Chat = require('act/Chat.js');
var ChatStore = require('store/Chat.js');

var ChatLog = require('comp/ChatLog.jsx');
var ChatInput = require('comp/ChatInput.jsx');
var ChatButtons = require('comp/ChatButtons.jsx');
var UserList = require('comp/UserList.jsx');

module.exports = React.createClass({
	mixins: [Reflux.connect(ChatStore), Reflux.connectFilter(require('store/LobbyServer.js'),
		_.partialRight(_.pick, 'nick'))],
	handleSelect: function(val){
		Chat.selectLogSource(val);
	},
	handleSend: function(val){
		if (this.state.selected.match(/^#/))
			Chat.sayChannel(this.state.selected.slice(1), val);
		else
			Chat.sayPrivate(this.state.selected, val);
	},
	getTabClass: function(tab){
		return React.addons.classSet({
			'selected': tab === this.state.selected,
			'attentionLow': this.state.logs[tab].unread > 0 && tab !== this.state.selected,
			'attentionHigh': this.state.logs[tab].needAttention,
		});
	},
	render: function(){
		var logs = _.omit(this.state.logs, '##battleroom');
		var log = logs[this.state.selected] || null;
		var users = _.mapValues(this.state.users, _.partialRight(_.omit, 'synced'));
		var topic = this.state.topic;

		// List channels first and private convos last.
		var channels = _.filter(_.keys(logs), function(name){ return name[0] === '#'; });
		var privates = _.filter(_.keys(logs), function(name){ return name[0] !== '#'; });
		return (<div className="chatManager">
			<div className="chatLeft">
			<ul className="chatTabs">
				{_(channels.concat(privates)).map(function(chan){
					return (<li
						onClick={_.partial(this.handleSelect, chan)}
						className={this.getTabClass(chan)}
						key={chan}>
						{chan}
					</li>);
				}.bind(this))}
			</ul>
			<ChatButtons
				selected={this.state.selected}
				subscribed={this.state.channelSubs[this.state.selected.slice(1)]}
			/>
			</div>
			<div className={'chatMain' + (users ? '' : ' noUserList') + (topic ? '' : ' noTopic')}>
				{topic && <div className="chatTopic">
					<div className="topicText">{topic.text.replace(/\\n/g, '\n')}</div>
					<div className="topicInfo">
						Topic set by {topic.author} on {topic.time.toLocaleString()}
					</div>
				</div>}
				<ChatLog
					log={log ? log.messages : []}
					unread={log ? log.unread : 0}
					nick={this.state.nick}
				/>
				<ChatInput onSend={this.handleSend} users={_.pluck(users, 'name')} />
			</div>
			{users && <UserList users={users} />}
		</div>);
	}
});
