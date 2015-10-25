/*
 * Chat join/leave/subscribe/favorite buttons.
 */

'use strict'

require('style/ChatButtons.sass');
var _ = require('lodash');
var Reflux = require('reflux');
var Chat = require('act/Chat.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var Settings = require('store/Settings.js');
var setSetting = require('act/Settings.js').set;

module.exports = React.createClass({
	displayName: 'ChatButtons',
	mixins: [Reflux.listenTo(Settings, 'updateSettings')],
	getInitialState: function(){
		return {
			joinMenuOpen: false,
			joining: null,
		};
	},
	updateSettings: function(setting){
		if (setting === 'autoJoin')
			this.forceUpdate();
	},
	handleOpenAddMenu: function(){
		this.setState({ joinMenuOpen: true });
		document.addEventListener('click', this.handleCloseAddMenu);
	},
	handleCloseAddMenu: function(evt){
		if (this.isMounted() && this.state.joinMenuOpen &&
			(evt === undefined || !this.getDOMNode().contains(evt.target))) {
			this.setState({ joinMenuOpen: false });
			document.removeEventListener('click', this.handleCloseAddMenu);
		}
	},
	handleAdd: function(kind){
		this.setState({ joining: kind }, function(){
			this.handleCloseAddMenu();
			this.refs.joinWhat.getDOMNode().focus();
		});
	},
	handleLeave: function(){
		if (this.props.selected.match(/^#/))
			Chat.leaveChannel(this.props.selected.slice(1));
		else
			Chat.closePrivate(this.props.selected);
	},
	handleSubscribe: function(){
		Chat.subscribeToChannel(this.props.selected.slice(1), !this.props.subscribed);
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
		if (this.state.joining === 'channel')
			Chat.joinChannel(val.replace(/^#/, ''));
		else
			Chat.openPrivate(val);
		this.setState({ joining: false });
	},
	handleFavorite: function(){
		var list = Settings.autoJoin.split('\n');
		if (list.indexOf(this.props.selected) >= 0)
			list = list.filter(function(x){ return x !== this.props.selected }.bind(this));
		else
			list.push(this.props.selected);
		setSetting('autoJoin', list.join('\n'));
	},
	render: function(){
		return <div className="chatButtons">
			<img onClick={this.handleOpenAddMenu} src="img/plus-small.png" />
			<img onClick={this.handleLeave} src="img/Remove.png" />
			{this.props.selected.match(/^#/) && <img
				src={'img/news_' + (this.props.subscribed ? '' : 'un') + 'subscribe.png'}
				onClick={this.handleSubscribe}
			/>}
			<img
				src={'img/heart_small' + (Settings.autoJoin.split('\n').indexOf(this.props.selected) >= 0 ?
					'' : '_empty') + '.png'}
				onClick={this.handleFavorite}
			/>
			{this.state.joinMenuOpen && <div className="joinMenu">
				<div onClick={_.partial(this.handleAdd, 'channel')}>Channel</div>
				<div onClick={_.partial(this.handleAdd, 'user')}>Private conversation</div>
			</div>}
			{this.state.joining && <ModalWindow title={'Adding ' + this.state.joining} onClose={this.handleCancel}>
				Enter the {this.state.joining} name:
				<input type="text" ref="joinWhat" onKeyDown={this.handleKey} />
				<button onClick={this.handleJoin}>OK</button>
			</ModalWindow>}
		</div>;
	}
});
