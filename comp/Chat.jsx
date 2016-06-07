/*
 * This brings other chat components together and feeds them data.
 */

'use strict'

require('style/Chat.sass');
var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');
var classNames = require('classnames');
var Chat = require('act/Chat.js');
var Log = require('act/Log.js');
var Battle = require('act/Battle.js');

var ChatLog = require('comp/ChatLog.jsx');
var ChatInput = require('comp/ChatInput.jsx');
var ChatButtons = require('comp/ChatButtons.jsx');
var UserList = require('comp/UserList.jsx');

var ColorPicker = require('comp/ColorPicker16.jsx');
var FontColor = require('comp/FontColor.jsx');

module.exports = React.createClass({
	displayName: 'Chat',
	mixins: [SPM.connect('chatStore'), SPM.connect('serverStore', 'server')],
	componentDidMount: function(){
		this.refs.chatInput.focusme();
	},
	handleSelect: function(val){
		Chat.selectLogSource(val);
		this.refs.chatInput.focusme();
	},
	handleSend: function(val, me){
		var match, command, params;
		var channel = null;
		if (this.state.selected.match(/^#/))
			channel = this.state.selected.slice(1);
				
		if( (match = val.match(/^\/([^ ]+)( (.*))?/)) ) {
			var pmatch;
			command = match[1];
			params = match[3] || '';

			if ((command === 'join' || command === 'j') && params) {
				Chat.joinChannel(params[0] === '#' ? params.slice(1) : params);
			} else if ((command === 'part' || command === 'leave') && channel !== null) {
				Chat.leaveChannel(channel);
			} else if (command === 'msg' && (pmatch = params.match(/^([^ ]+) (.*)$/)) ) {
				Chat.sayPrivate(pmatch[1], pmatch[2]);
			} else {
				Log.warningBox('Unrecognized command or wrong syntax. For the command list, see help.');
			}
		} else {
			if (channel !== null)
				Chat.sayChannel(channel, val, me);
			else
				Chat.sayPrivate(this.state.selected, val, me);
		}
	},
	handleJoinUserBattle: function(user){
		var id = _.findKey(this.state.server.battles, { founder: user });
		if (id !== undefined)
			Battle.joinMultiplayerBattle(id);
	},
	handleColorPicker:function(){
		this.setState({ showColorPicker:!this.state.showColorPicker })
	},
	getTabClass: function(tab){
		return classNames({
			'selected': tab === this.state.selected,
			'attentionLow': this.state.logs[tab].unread > 0 && tab !== this.state.selected,
			'attentionHigh': this.state.logs[tab].needAttention,
		});
	},
	handleChatClick: function(){
		this.refs.chatInput.focusme();
	},
	/*
	handleColorClick:function(color){
		this.refs.chatInput.addColorCode(color);
		this.refs.chatInput.focusme();
	},
	*/
	handleColorChoose:function(str)
	{
		this.refs.chatInput.addColorCode(str);
		this.refs.chatInput.focusme();
	},
	render: function(){
		var logs = _.omit(this.state.logs, '##battleroom');
		var log = logs[this.state.selected] || null;
		var users = this.state.users || null;
		var topic = this.state.topic;
		var privBar = null;

		if (this.state.selected[0] !== '#')
			privBar = 'User is ' + (this.state.server.users[this.state.selected] ? 'on' : 'off') + 'line.';

		var colorPickerClasses = classNames({
			'hideColorPicker': !this.state.showColorPicker,
			'placeColorPicker': this.state.showColorPicker,
		});

		// List channels first and private convos last.
		var channels = _.filter(_.keys(logs), function(name){ return name[0] === '#'; });
		var privates = _.filter(_.keys(logs), function(name){ return name[0] !== '#'; });
		return <div className="chatManager">
			<div className="chatLeft">
			<ul className="chatTabs">
				{channels.concat(privates).map(function(chan){
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
			<div className={classNames({
				chatMain: true,
				noUserList: !users,
				noTopic: !topic && !privBar
			})}>
				{topic && <div className="chatTopic">
					<div className="topicText">{topic.text.replace(/\\n/g, '\n')}</div>
					<div className="topicInfo">
						Topic set by {topic.author} on {topic.time.toLocaleString()}
					</div>
				</div>}

				{privBar && <div className="chatTopic">
					<div className="topicText">{privBar}</div>
				</div>}

				<ChatLog
					log={log ? log.messages : []}
					unread={log ? log.unread : 0}
					nick={this.state.server.nick}
					onClick={this.handleChatClick}
					onJoinUserBattle={this.handleJoinUserBattle}
				/>
				<div className={colorPickerClasses}>
					<FontColor
						onColorChoose={this.handleColorChoose}
					/>
				</div>
				<ChatInput
					ref="chatInput"
					onSend={this.handleSend}
					onSummonColorPicker={this.handleColorPicker}
					users={_.pluck(users, 'name')}
				/>
			</div>
			{users && <UserList users={users} battles={this.state.server.battles} />}
		</div>;
	}
});
