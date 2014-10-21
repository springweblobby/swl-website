/** @jsx React.DOM
 *
 * Displays various screens (I don't want to call them tabs because it's not
 * the classic tab layout) and the way to navigate them.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Screens = require('./ScreenTypes.js');
var ConnectButton = require('./ConnectButton.jsx');
var Home = require('./Home.jsx');
var ChatManager = require('./ChatManager.jsx');
var LobbySettings = require('./Settings.jsx');
var BattleStore = require('../store/CurrentBattle.js');
var Battle = require('./Battle.jsx');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(BattleStore, 'updateBattle', 'updateBattle')],
	getInitialState: function(){
		return {
			selected: Screens.HOME,
			battleStore: null,
			battleTitle: '',
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
			return (this.state.battleStore ? <Battle battle={this.state.battleStore} /> : null);
		}
	},
	updateBattle: function(data){
		// Switch to the battle screen when a new battle is opened.
		if (data.battleStore !== this.state.battleStore)
			_.extend(data, { selected: Screens.BATTLE });

		this.setState(data);
	},
	handleSelect: function(val){
		this.setState({ selected: val });
	},
	render: function(){
		return (<div className="screenManager">
			<div className="topRightButtons">
				<button>Downloads</button>
				<ConnectButton />
			</div>
			<ul className="screenNav">
				<li className={this.state.selected === Screens.HOME ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.HOME)}>Menu</li>
				<li className={this.state.selected === Screens.CHAT ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.CHAT)}>Chat</li>
				<li className={this.state.selected === Screens.BATTLE ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.BATTLE)}>{this.state.battleTitle}</li>
			</ul>
			<div className="screenMain">{this.getScreen(this.state.selected)}</div>
		</div>);
	}
});
