/** @jsx React.DOM
 *
 * Chat join/leave/subscribe/favorite buttons.
 */

'use strict'

var Chat = require('../act/Chat.js');
var ModalWindow = require('./ModalWindow.jsx');

module.exports = React.createClass({
	getInitialState: function(){
		return { joining: false };
	},
	handleAdd: function(){
		this.setState({ joining: true }, function(){
			this.refs.joinWhat.getDOMNode().focus();
		});
	},
	handleLeave: function(){
		if (this.props.selected.match(/^#/))
			Chat.leaveChannel(this.props.selected.slice(1));
		else
			Chat.closePrivate(this.props.selected);
	},
	handleCancel: function(){
		this.setState({ joining: false });
	},
	handleKey: function(evt){
		if (evt.key === 'Enter')
			this.handleJoin();
	},
	handleJoin: function(){
		var val = this.refs.joinWhat.getDOMNode().value;
		if (val.match(/^#/))
			Chat.joinChannel(val.slice(1));
		else
			Chat.openPrivate(val);
		this.setState({ joining: false });
	},
	render: function(){
		return (<div className="chatButtons">
			<img onClick={this.handleAdd} src="img/plus-small.png" />
			<img onClick={this.handleLeave} src="img/Remove.png" />
			<img src="img/news_subscribe.png" />
			<img src="img/heart_small.png" />
			{this.state.joining ? <ModalWindow title="Joining channel" onClose={this.handleCancel}>
				Enter a channel name (e.g. #weblobby) or a user name:
				<input type="text" ref="joinWhat" onKeyDown={this.handleKey} />
				<button onClick={this.handleJoin}>OK</button>
			</ModalWindow> : null}
		</div>);
	}
});
