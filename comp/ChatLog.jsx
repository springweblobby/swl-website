/** @jsx React.DOM */

'use strict'

var ChatStore = require('../store/Chat.js');

module.exports = React.createClass({
	render: function(){
		return (<div className="chatLog">
				{this.props.log.map(function(entry){
					return (<div className="chatEntry" key={entry.id}>
						<div className="chatTimestamp">{entry.date.toTimeString().replace(/ [A-Z][A-Z][A-Z].*$/, '')}</div>
						{entry.type === ChatStore.MsgType.ME ?
							[<div className="chatAuthor chatSlashMe" key='a'>*</div>, // the keys are to silence react warnings
							<div className="chatMessage chatSlashMe" key='b'>{entry.author} {entry.message}</div>]
							:
							[<div className="chatAuthor" key='c'>{entry.author}</div>,
							<div className="chatMessage" key='d'>{entry.message}</div>]
						}
					</div>);
				})}
			</div>)
	}
});
