/** @jsx React.DOM */

'use strict'

var ChatStore = require('../store/Chat.js');

// The usage of this.scrollToBottom below is hacky (since the proper way to do
// that is to make it part of this.state), but calling this.setState() to
// change it would cause a re-render and make scrolling hitchy for logs longer
// than 1000 messages. When this is rewritten with lazy rendering,
// scrollToBottom may go into it's proper place in the state.

module.exports = React.createClass({
	componentWillMount: function(){
		this.scrollToBottom = true;
	},
	componentWillReceiveProps: function(props){
		// Scroll to bottom if we switch to another channel.
		if (this.props.source !== props.source)
			this.scrollToBottom = true;
	},
	componentDidUpdate: function(){
		if (this.scrollToBottom){
			var node = this.getDOMNode();
			node.scrollTop = node.scrollHeight - node.clientHeight;
		}
	},
	handleScroll: function(evt){
		var node = this.getDOMNode();
		if (node.scrollTop > node.scrollHeight - node.clientHeight * 1.2)
			this.scrollToBottom = true;
		else
			this.scrollToBottom = false;
	},
	render: function(){
		var lastAuthor = '';
		return (<div className="chatLog" onScroll={this.handleScroll}>
			{this.props.log.map(function(entry){

				var authorClass = 'chatAuthor';
				var messageClass = 'chatMessage';
				var author = (entry.author === lastAuthor ? '' : entry.author);
				var message = entry.message;
				lastAuthor = entry.author;

				if (entry.type === ChatStore.MsgType.ME){
					author = '*';
					message = entry.author + ' ' + entry.message;
					authorClass += ' chatSlashMe';
					messageClass += ' chatSlashMe';
				}
				return (<div className="chatEntry" key={entry.id}>
					<div className="chatTimestamp">{entry.date.toTimeString().replace(/ [A-Z][A-Z][A-Z].*$/, '')}</div>
					<div className={authorClass}>{author}</div>
					<div className={messageClass}>{message}</div>
				</div>);
			})}
		</div>)
	}
});
