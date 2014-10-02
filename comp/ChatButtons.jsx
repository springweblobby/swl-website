/** @jsx React.DOM */

'use strict'

var Chat = require('../act/Chat.js');

module.exports = React.createClass({
	handleAdd: function(){
	},
	handleLeave: function(){
		if (this.props.selected.match(/^#/))
			Chat.leaveChannel(this.props.selected.slice(1));
	},
	render: function(){
		return (<div className="chatButtons">
					<img onClick={this.handleAdd} src="img/plus-small.png" />
					<img onClick={this.handleLeave} src="img/Remove.png" />
					<img src="img/news_subscribe.png" />
					<img src="img/heart_small.png" />
			</div>);
	}
});
