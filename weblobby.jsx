/** @jsx React.DOM */

'use strict'

window.QWeblobbyApplet && QWeblobbyApplet.init();

var AppScreens = require('./comp/AppScreens.jsx');

var App = React.createClass({
	render: function(){
		return <AppScreens />;
	}
});

React.renderComponent(<App />, document.getElementById('main'));
