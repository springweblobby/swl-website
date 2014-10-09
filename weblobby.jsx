/** @jsx React.DOM */

'use strict'

window.QWeblobbyApplet && QWeblobbyApplet.init();

var ScreenManager = require('./comp/ScreenManager.jsx');

var App = React.createClass({
	render: function(){
		return <ScreenManager />;
	}
});

React.renderComponent(<App />, document.getElementById('main'));
