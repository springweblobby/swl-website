/** @jsx React.DOM */

'use strict'

window.QWeblobbyApplet && QWeblobbyApplet.init();

var ConnectButton = require('./comp/ConnectButton.jsx');
var ScreenManager = require('./comp/ScreenManager.jsx');

var App = React.createClass({
	render: function(){
		return (<div>
			<ScreenManager />
		</div>);
	}
});

React.renderComponent(<App />, document.getElementById('main'));
