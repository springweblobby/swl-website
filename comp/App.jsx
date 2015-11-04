/*
 * Displays various screens (I don't want to call them tabs because it's not
 * the classic tab layout) and the way to navigate them.
 */

'use strict'

require('style/App.sass');
var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');
var classNames = require('classnames');
var Screens = require('comp/ScreenTypes.js');
var LogMessages = require('comp/LogMessages.jsx');
var LobbySettings = require('comp/LobbySettings.jsx');
var ConnectButton = require('comp/ConnectButton.jsx');
var LoginWindow = require('comp/LoginWindow.jsx');
var Home = require('comp/Home.jsx');
var Chat = require('comp/Chat.jsx');
var BattleActions = require('act/Battle.js');
var Battle = require('comp/Battle.jsx');
var DownloadList = require('comp/DownloadList.jsx');
var Help = require('comp/Help.jsx');

module.exports = React.createClass({
	displayName: 'App',
	mixins: [
		SPM.connect('gameInfoStore', '', ['currentOperation']),
		SPM.connect('processStore', '', ['currentProcess']),
		SPM.listenTo('currentBattleStore', 'updateBattle'),
		SPM.listenTo('chatStore', 'updateChat'),
	],
	getInitialState: function(){
		return {
			selected: Screens.HOME,
			battleStore: null,
			battleTitle: '',
			chatAttention: false,
			showingDownloads: false,
		};
	},
	getScreen: function(name){
		switch (name){

		case Screens.HOME:
			return <Home
				onSelect={this.handleSelect}
				gameInfoStore={this.props.gameInfoStore}
				serverStore={this.props.serverStore}
			/>;
		case Screens.CHAT:
			return <Chat chatStore={this.props.chatStore} serverStore={this.props.serverStore} />;
		case Screens.SETTINGS:
			return <LobbySettings />;
		case Screens.BATTLE:
			return this.state.battleStore &&
				<Battle
					battle={this.state.battleStore}
					onClose={BattleActions.closeCurrentBattle}
					gameInfoStore={this.props.gameInfoStore}
					processStore={this.props.processStore}
					serverStore={this.props.serverStore}
				/>;
		case Screens.HELP:
			return <Help />
		}
	},
	updateChat: function(data){
		this.setState({ chatAttention: _.any(_.omit(data.logs, '##battleroom'), 'needAttention') });
	},
	updateBattle: function(data){
		// Switch to the battle screen when a new battle is opened or back to
		// main menu if the battle closed.
		if (data.battleStore !== this.state.battleStore)
			_.extend(data, { selected: Screens.BATTLE });
		if (!data.battleStore && this.state.selected === Screens.BATTLE)
			_.extend(data, { selected: Screens.HOME });

		this.setState(data);
	},
	handleSelect: function(val){
		this.setState({ selected: val });
	},
	handleToggleDownloads: function(){
		this.setState({ showingDownloads: !this.state.showingDownloads });
	},
	render: function(){
		var currentOperation =  this.state.currentOperation || this.state.currentProcess;
		
		return <div className={'screenManager' +
					(this.state.showingDownloads ? ' showingDownloads' : '')}>
			<ul className="screenNav">
				<li className={this.state.selected === Screens.HOME ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.HOME)}>Menu</li>
				<li className={classNames({
						'selected': this.state.selected === Screens.CHAT,
						'attention': this.state.chatAttention && this.state.selected !== Screens.CHAT,
					})}
					onClick={_.partial(this.handleSelect, Screens.CHAT)}>Chat</li>
				{this.state.battleStore && <li
					className={this.state.selected === Screens.BATTLE ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.BATTLE)}
				>
					{this.state.battleTitle || 'Battle'}
				</li>}
			</ul>
			<div className="screenMain">{this.getScreen(this.state.selected)}</div>
			<DownloadList processStore={this.props.processStore} />
			<div className="topRight">
				{currentOperation && <div className="gameInfoStatus">
					<img src="img/bluespinner.gif" /> {currentOperation}
				</div>}
				<div className="topRightButtons">
					<button onClick={this.handleToggleDownloads}>Downloads</button>
					<ConnectButton serverStore={this.props.serverStore} />
				</div>
			</div>
			<LoginWindow serverStore={this.props.serverStore} />
			<LogMessages />
		</div>;
	}
});
