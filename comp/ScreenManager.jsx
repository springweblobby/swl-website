/** @jsx React.DOM
 *
 * Displays various screens (I don't want to call them tabs because it's not
 * the classic tab layout) and the way to navigate them.
 */

'use strict'

var _ = require('lodash');
var Home = require('./Home.jsx');
var ChatManager = require('./ChatManager.jsx');

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
		}
	},
	handleSelect: function(val, evt){
		evt && evt.preventDefault();
		this.setState({ selected: val });
	},
	render: function(){
		return (<div className="screenManager">
			<div className="screenNav">
				<a href="#" onClick={_.partial(this.handleSelect, 'home')}>Menu</a>
				<a href="#" onClick={_.partial(this.handleSelect, 'chat')}>Chat</a>
			</div>
			<div className="screenMain">{this.getScreen(this.state.selected)}</div>
		</div>);
	}
});
