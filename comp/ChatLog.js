/** @jsx React.DOM */

'use strict'

var Reflux = require('reflux');
var Chat = require('../act/Chat.js');
var ChatStore = require('../store/Chat.js');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(ChatStore, 'update', 'update')],
	getInitialState: function(){
		return { log: [] };
	},
	update: function(data){
		var log = data[this.props.chat];
		if (log)
			this.setState({ log: log });
	},
	render: function(){
		return (<div className="chatLog">
				{this.state.log.map(function(entry){
					return (<div className="chatEntry" key={entry.id}>
						<div className="chatTimestamp">{entry.date.toTimeString().replace(/ [A-Z][A-Z][A-Z].*$/, '')}</div>
						{entry.type === ChatStore.MsgType.ME ?
							[<div className="chatSlashMe">*</div>,
							<div className="chatSlashMe">{entry.author} {entry.message}</div>]
							:
							[<div className="chatAuthor">{entry.author}</div>,
							<div className="chatMessage">{entry.message}</div>]
						}
					</div>);
				})}
			</div>)
	}
});
