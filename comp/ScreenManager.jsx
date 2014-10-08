/** @jsx React.DOM
 *
 * Displays various screens (I don't want to call them tabs because it's not
 * the classic tab layout) and the way to navigate them.
 */

'use strict'

var _ = require('lodash');
var Home = require('./Home.jsx');
var ChatManager = require('./ChatManager.jsx');
var Settings = require('./Settings.jsx');

module.exports = React.createClass({
	getInitialState: function(){
		return { selected: 'home' };
	},
	getScreen: function(name){
		switch (name){

		case 'home':
			return <Home onSelect={this.handleSelect} />;
		case 'chat':
			return <ChatManager />;
		case 'settings':
			return <Settings />;
		}
	},
	handleSelect: function(val){
		this.setState({ selected: val });
	},
	render: function(){
		return (<div className="screenManager">
			<ul className="screenNav">
				<li onClick={_.partial(this.handleSelect, 'home')}
					className={this.state.selected === 'home' ? 'selected' : ''}>Menu</li>
				<li onClick={_.partial(this.handleSelect, 'chat')}
					className={this.state.selected === 'chat' ? 'selected' : ''}>Chat</li>
			</ul>
			<div className="screenMain">{this.getScreen(this.state.selected)}</div>
		</div>);
	}
});
