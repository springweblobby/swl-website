/** @jsx React.DOM
 *
 * Displays various screens (I don't want to call them tabs because it's not
 * the classic tab layout) and the way to navigate them.
 */

'use strict'

var _ = require('lodash');
var Screens = require('./ScreenTypes.js');
var Home = require('./Home.jsx');
var ChatManager = require('./ChatManager.jsx');
var LobbySettings = require('./Settings.jsx');

module.exports = React.createClass({
	getInitialState: function(){
		return { selected: Screens.HOME };
	},
	getScreen: function(name){
		switch (name){

		case Screens.HOME:
			return <Home onSelect={this.handleSelect} />;
		case Screens.CHAT:
			return <ChatManager />;
		case Screens.SETTINGS:
			return <LobbySettings />;
		}
	},
	handleSelect: function(val){
		this.setState({ selected: val });
	},
	render: function(){
		return (<div className="screenManager">
			<ul className="screenNav">
				<li className={this.state.selected === Screens.HOME ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.HOME)}>Menu</li>
				<li className={this.state.selected === Screens.CHAT ? 'selected' : ''}
					onClick={_.partial(this.handleSelect, Screens.CHAT)}>Chat</li>
			</ul>
			<div className="screenMain">{this.getScreen(this.state.selected)}</div>
		</div>);
	}
});
