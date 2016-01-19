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
var LogMessages = require('comp/LogMessages.jsx');
var LobbySettings = require('comp/LobbySettings.jsx');
var ConnectButton = require('comp/ConnectButton.jsx');
var LoginWindow = require('comp/LoginWindow.jsx');
var Home = require('comp/Home.jsx');
var Chat = require('comp/Chat.jsx');
var BattleActions = require('act/Battle.js');
var Battle = require('comp/Battle.jsx');
var DownloadList = require('comp/DownloadList.jsx');
var BattleList = require('comp/BattleList.jsx');
var Help = require('comp/Help.jsx');

var unclosableTabs = ['home', 'chat', 'battle'];

module.exports = React.createClass({
	displayName: 'App',
	mixins: [
		SPM.connect('gameInfoStore', '', ['currentOperation']),
		SPM.connect('processStore', '', ['currentProcess']),
		SPM.listenTo('currentBattleStore', 'updateCurrentBattle'),
		SPM.listenTo('chatStore', 'updateChat'),
	],
	getInitialState: function(){
		return {
			selected: 'home',
			openTabs: ['home', 'chat'],
			battleStore: null,
			battleTitle: '',
			chatAttention: false,
			showingDownloads: false,
		};
	},
	getScreen: function(name){
		switch (name){

		case 'home':
			return <Home
				onSelect={this.handleSelect}
				onToggleDownloads={this.handleToggleDownloads}
				gameInfoStore={this.props.gameInfoStore}
				serverStore={this.props.serverStore}
			/>;
		case 'chat':
			return <Chat chatStore={this.props.chatStore} serverStore={this.props.serverStore} />;
		case 'settings':
			return <LobbySettings gameInfoStore={this.props.gameInfoStore}/>;
		case 'battle':
			return this.state.battleStore &&
				<Battle
					battle={this.state.battleStore}
					onClose={BattleActions.closeCurrentBattle}
					gameInfoStore={this.props.gameInfoStore}
					processStore={this.props.processStore}
					serverStore={this.props.serverStore}
				/>;
		case 'battlelist':
			return <BattleList
				gameInfoStore={this.props.gameInfoStore}
				serverStore={this.props.serverStore}
			/>
		case 'help':
			return <Help />
		default:
			throw new Error("Unhandled screen type.");
		}
	},
	getScreenTabName: function(screen){
		switch (screen){

		case 'home':
			return "Menu";
		case 'chat':
			return <span className={this.state.chatAttention && 'attention' || ''}>Chat</span>;
		case 'settings':
			return "Settings";
		case 'battle':
			return this.state.battleStore && this.state.battleTitle;
		case 'help':
			return "Help";
		case 'battlelist':
			return "Battles";
		default:
			throw new Error("Unhandled screen type.");
		}
	},
	updateChat: function(data){
		this.setState({ chatAttention: _.any(_.omit(data.logs, '##battleroom'), 'needAttention') });
	},
	updateCurrentBattle: function(data){
		// Switch to the battle screen when a new battle is opened or back to
		// main menu if the battle closed.
		var state = {};
		var tabs = this.state.openTabs;
		if (data.battleStore !== this.state.battleStore)
			state = { selected: 'battle', openTabs: tabs.concat(['battle']) };
		if (!data.battleStore && this.state.selected === 'battle')
			state = { selected: 'home', openTabs: _.reject(tabs, _.partial(_.eq, 'battle')) };

		this.setState(_.extend(data, state));
	},
	handleSelect: function(tab){
		var tabs = this.state.openTabs;
		if (!_.includes(tabs, tab))
			tabs = this.state.openTabs.concat([tab]);
		this.setState({
			openTabs: tabs,
			selected: tab
		});
	},
	handleClose: function(tab, evt){
		evt.stopPropagation();
		var idx = _.findIndex(this.state.openTabs, _.partial(_.eq, tab));
		var tabs = _.reject(this.state.openTabs, _.partial(_.eq, tab));
		this.setState({
			openTabs: tabs,
			selected: tabs[idx] || _.last(tabs),
		});
	},
	handleToggleDownloads: function(){
		this.setState({ showingDownloads: !this.state.showingDownloads });
	},
	render: function(){
		var currentOperation =  this.state.currentOperation || this.state.currentProcess;
		
		return <div className={'appContent' +
					(this.state.showingDownloads ? ' showingDownloads' : '')}>
			<nav className="screenNav">
				{this.state.openTabs.map(function(tab){
					var selected = this.state.selected === tab;
					var closable = selected && !_.includes(unclosableTabs, tab);
					return <span
						className={classNames({
							selected: selected,
							closable: closable,
						})}
						onClick={_.partial(this.handleSelect, tab)}
					>
						{this.getScreenTabName(tab)}
						{closable &&
							<span className="close" onClick={_.partial(this.handleClose, tab)}>×</span>}
					</span>;
				}.bind(this))}
			</nav>

			<div className="screenMain">{this.getScreen(this.state.selected)}</div>
			<DownloadList processStore={this.props.processStore} />
			<div className="topRight">
				{currentOperation && <div className="gameInfoStatus">
					<img src={require('img/bluespinner.gif')} /> {currentOperation}
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
