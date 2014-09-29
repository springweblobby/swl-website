/** @jsx React.DOM */
(function(){
    'use strict'

	window.QWeblobbyApplet && QWeblobbyApplet.init();

	var ConnectButton = require('./comp/ConnectButton.jsx');
	var UserList = require('./comp/UserList.jsx');

	var App = React.createClass({
		render: function(){
			return <div>
				<p><ConnectButton /></p>
				<img src="img/bigloader.gif" />
				<UserList />
			</div>
		}
	});

	React.renderComponent(<App />, document.getElementById('main'));
})()
