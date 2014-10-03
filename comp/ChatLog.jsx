/** @jsx React.DOM */

'use strict'

var ChatStore = require('../store/Chat.js');

module.exports = React.createClass({
	render: function(){
		var lastAuthor = '';
		return (<div className="chatLog">
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
