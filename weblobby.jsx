/** @jsx React.DOM */
(function(){
    'use strict'

	var ConnectButton = require('./comp/ConnectButton.js');

	React.renderComponent(<ConnectButton />, document.getElementById('main'));
})()
