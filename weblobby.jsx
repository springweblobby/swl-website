/** @jsx React.DOM */

'use strict'

var Applet = require('./store/Applet.js');
var AppScreens = require('./comp/AppScreens.jsx');

Applet && Applet.init();

var App = React.createClass({
	render: function(){
		return <AppScreens />;
	}
});

React.renderComponent(<App />, document.getElementById('main'));
