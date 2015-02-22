/** @jsx React.DOM
 *
 * Displays various screens (I don't want to call them tabs because it's not
 * the classic tab layout) and the way to navigate them.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Screens = require('./ScreenTypes.js');
var LogMessages = require('./LogMessages.jsx');
var LobbySettings = require('./Settings.jsx');
var ConnectButton = require('./ConnectButton.jsx');
var LoginWindow = require('./LoginWindow.jsx');
var Home = require('./Home.jsx');
var ChatManager = require('./Chat.jsx');
var BattleActions = require('../act/Battle.js');
var Battle = require('./Battle.jsx');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(require('../store/CurrentBattle.js'), 'updateBattle', 'updateBattle'),
		Reflux.connectFilter(require('../store/GameInfo.js'), _.partialRight(_.pick, 'currentOperation')),
		Reflux.listenTo(require('../store/Chat.js'), 'updateChat', 'updateChat')],
	getInitialState: function(){
		return {
			selected: Screens.HOME,
			battleStore: null,
			battleTitle: '',
			chatAttention: false,
		};
	},
	getScreen: function(name){
		switch (name){

		case Screens.HOME:
			return <Home onSelect={this.handleSelect} />;
		case Screens.CHAT:
			return <ChatManager />;
		case Screens.SETTINGS:
			return <LobbySettings />;
		case Screens.BATTLE:
			return (this.state.battleStore ?
				<Battle battle={this.state.battleStore} onClose={BattleActions.closeCurrentBattle} />
			: null);
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
	render: function(){
		return (<div className="screenManager">
			<div className="topRight">
				{this.state.currentOperation !== null ? <div className="gameInfoStatus">
					<img src="img/bluespinner.gif" /> {this.state.currentOperation}
				</div> : null}
				<div className="topRightButtons">
					<button>Downloads</button>
					<ConnectButton />
				</div>
			</div>
			<ul className="screenNav">
				<li className={this.state.selected === Screens.HOME ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.HOME)}>Menu</li>
				<li className={React.addons.classSet({
						'selected': this.state.selected === Screens.CHAT,
						'attention': this.state.chatAttention && this.state.selected !== Screens.CHAT,
					})}
					onClick={_.partial(this.handleSelect, Screens.CHAT)}>Chat</li>
				<li className={this.state.selected === Screens.BATTLE ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.BATTLE)}>{this.state.battleTitle}</li>
			</ul>
			<div className="screenMain">{this.getScreen(this.state.selected)}</div>
			<LoginWindow />
			<LogMessages />
		</div>);
	}
});
